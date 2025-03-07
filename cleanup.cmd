@echo off
echo 开始清理冗余文件...

REM 删除已迁移的组件文件
if exist "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\MindMap.tsx" (
    del /q "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\MindMap.tsx"
    echo 删除了 MindMap.tsx
)
if exist "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\HelpModal.tsx" (
    del /q "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\HelpModal.tsx"
    echo 删除了 HelpModal.tsx
)
if exist "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\KeyBindingModal.tsx" (
    del /q "i:\qkyufw\Desktop\myProject\whiteBoard1\whiteboard\src\components\KeyBindingModal.tsx"
    echo 删除了 KeyBindingModal.tsx
)

echo 文件清理完成!
