#define _WIN32_WINNT 0x0601
#include <windows.h>
#include <iostream>
#include <string>
#include <queue>

struct RawKeyEvent {
    DWORD vkCode;
    DWORD scanCode;
    bool isKeyDown;
    bool isExtended;
    DWORD time;
};

std::queue<RawKeyEvent> g_eventQueue;
CRITICAL_SECTION g_queueLock;
HANDLE g_hQueueEvent = NULL;
bool g_running = true;
HHOOK g_hKeyboardHook = NULL;

std::string GetKeyName(DWORD vkCode, DWORD scanCode, bool isExtended) {
    switch (vkCode) {
        case VK_SPACE: return "SPACE";
        case VK_RETURN: return "ENTER";
        case VK_BACK: return "BACK";
        case VK_TAB: return "TAB";
        case VK_ESCAPE: return "ESC";
        case VK_SHIFT:
        case VK_LSHIFT: return "SHIFT";
        case VK_RSHIFT: return "R_SHIFT";
        case VK_CONTROL:
        case VK_LCONTROL: return "CTRL";
        case VK_RCONTROL: return "R_CTRL";
        case VK_MENU:
        case VK_LMENU: return "ALT";
        case VK_RMENU: return "R_ALT";
        case VK_CAPITAL: return "CAPS";
        case VK_LWIN:
        case VK_RWIN: return "WIN";
        case VK_APPS: return "MENU";
        case VK_DELETE: return "DEL";
        case VK_INSERT: return "INS";
        case VK_HOME: return "HOME";
        case VK_END: return "END";
        case VK_PRIOR: return "PGUP";
        case VK_NEXT: return "PGDN";
        case VK_UP: return "UP";
        case VK_DOWN: return "DOWN";
        case VK_LEFT: return "LEFT";
        case VK_RIGHT: return "RIGHT";
        case VK_SNAPSHOT: return "PRTSC";
        case VK_SCROLL: return "SCRLK";
        case VK_PAUSE: return "PAUSE";
        case VK_NUMLOCK: return "NUMLK";
        case VK_OEM_1: return ";";
        case VK_OEM_PLUS: return "=";
        case VK_OEM_COMMA: return ",";
        case VK_OEM_MINUS: return "-";
        case VK_OEM_PERIOD: return ".";
        case VK_OEM_2: return "/";
        case VK_OEM_3: return "`";
        case VK_OEM_4: return "[";
        case VK_OEM_5: return "\\";
        case VK_OEM_6: return "]";
        case VK_OEM_7: return "'";
    }

    if (vkCode >= VK_F1 && vkCode <= VK_F24) return "F" + std::to_string(vkCode - VK_F1 + 1);
    if (vkCode >= VK_NUMPAD0 && vkCode <= VK_NUMPAD9) return "NUM" + std::to_string(vkCode - VK_NUMPAD0);
    if (vkCode >= '0' && vkCode <= '9') return std::string(1, (char)vkCode);
    if (vkCode >= 'A' && vkCode <= 'Z') return std::string(1, (char)vkCode);

    LONG lParam = (scanCode << 16);
    if (isExtended) lParam |= (1 << 24);
    wchar_t nameBuf[64] = { 0 };
    int len = GetKeyNameTextW(lParam, nameBuf, 63);
    if (len > 0) {
        char mbBuf[128] = { 0 };
        WideCharToMultiByte(CP_UTF8, 0, nameBuf, len, mbBuf, 127, NULL, NULL);
        return std::string(mbBuf);
    }

    return "VK_" + std::to_string(vkCode);
}

DWORD WINAPI WorkerThread(LPVOID lpParam) {
    while (g_running) {
        WaitForSingleObject(g_hQueueEvent, 100);

        while (true) {
            RawKeyEvent evt;
            bool hasEvent = false;

            EnterCriticalSection(&g_queueLock);
            if (!g_eventQueue.empty()) {
                evt = g_eventQueue.front();
                g_eventQueue.pop();
                hasEvent = true;
            }
            LeaveCriticalSection(&g_queueLock);

            if (!hasEvent || !g_running) break;

            std::string keyName = GetKeyName(evt.vkCode, evt.scanCode, evt.isExtended);
            bool shift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;
            bool ctrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
            bool alt = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
            bool win = ((GetAsyncKeyState(VK_LWIN) & 0x8000) != 0) || ((GetAsyncKeyState(VK_RWIN) & 0x8000) != 0);

            std::string escapedKey = "";
            for (char c : keyName) {
                if (c == '\\') escapedKey += "\\\\";
                else if (c == '"') escapedKey += "\\\"";
                else escapedKey += c;
            }

            std::cout << "{\"event\":\"" << (evt.isKeyDown ? "keydown" : "keyup")
                      << "\",\"vk\":" << evt.vkCode
                      << ",\"scan\":" << evt.scanCode
                      << ",\"name\":\"" << escapedKey << "\""
                      << ",\"shift\":" << (shift ? "true" : "false")
                      << ",\"ctrl\":" << (ctrl ? "true" : "false")
                      << ",\"alt\":" << (alt ? "true" : "false")
                      << ",\"win\":" << (win ? "true" : "false")
                      << ",\"time\":" << evt.time
                      << "}\n";
            std::cout.flush();
        }
    }
    return 0;
}

LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION) {
        KBDLLHOOKSTRUCT* pKbd = (KBDLLHOOKSTRUCT*)lParam;
        bool isKeyDown = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN);
        bool isKeyUp = (wParam == WM_KEYUP || wParam == WM_SYSKEYUP);

        if (isKeyDown || isKeyUp) {
            RawKeyEvent evt;
            evt.vkCode = pKbd->vkCode;
            evt.scanCode = pKbd->scanCode;
            evt.isKeyDown = isKeyDown;
            evt.isExtended = (pKbd->flags & LLKHF_EXTENDED) != 0;
            evt.time = pKbd->time;

            EnterCriticalSection(&g_queueLock);
            g_eventQueue.push(evt);
            LeaveCriticalSection(&g_queueLock);

            SetEvent(g_hQueueEvent);
        }
    }
    return CallNextHookEx(g_hKeyboardHook, nCode, wParam, lParam);
}

DWORD WINAPI StdinWatchThread(LPVOID lpParam) {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line == "exit" || line == "quit") break;
    }
    g_running = false;
    SetEvent(g_hQueueEvent);
    PostQuitMessage(0);
    return 0;
}

int main() {
    SetPriorityClass(GetCurrentProcess(), HIGH_PRIORITY_CLASS);
    std::ios::sync_with_stdio(false);
    std::cin.tie(NULL);

    InitializeCriticalSection(&g_queueLock);
    g_hQueueEvent = CreateEvent(NULL, FALSE, FALSE, NULL);

    std::cout << "{\"event\":\"ready\",\"version\":\"2.0.0\"}\n";
    std::cout.flush();

    HANDLE hWorker = CreateThread(NULL, 0, WorkerThread, NULL, 0, NULL);
    HANDLE hStdin = CreateThread(NULL, 0, StdinWatchThread, NULL, 0, NULL);

    g_hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, GetModuleHandle(NULL), 0);
    if (!g_hKeyboardHook) {
        std::cerr << "{\"event\":\"error\",\"message\":\"Failed to install keyboard hook\"}\n";
        return 1;
    }

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    if (g_hKeyboardHook) {
        UnhookWindowsHookEx(g_hKeyboardHook);
        g_hKeyboardHook = NULL;
    }

    g_running = false;
    SetEvent(g_hQueueEvent);

    if (hWorker) {
        WaitForSingleObject(hWorker, 1000);
        CloseHandle(hWorker);
    }
    if (hStdin) {
        CloseHandle(hStdin);
    }

    CloseHandle(g_hQueueEvent);
    DeleteCriticalSection(&g_queueLock);

    return 0;
}
