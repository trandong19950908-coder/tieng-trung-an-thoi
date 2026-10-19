# Tiếng Trung An Thới — Main repository

Dự án học tiếng Trung và tuyển sinh tại Phú Quốc, kế thừa chức năng website v1.5. **Đây là nền tảng chuyển đổi sang continuous development, chưa phải sản phẩm 4 mô-đun hoàn thiện.**

## Chạy trên Windows (PowerShell)

Cài Node.js 20+ và Git. Mở Terminal ở thư mục gốc dự án:

```powershell
$env:ADMIN_PASSWORD="MAT_KHAU_RIENG_CUA_BAN"
$env:COOKIE_SECRET="MOT_CHUOI_BI_MAT_RIENG_TOI_THIEU_32_KY_TU"
npm run setup
npm start
```

Mở `http://localhost:3000`, học ở `/hoc.html`, quản trị ở `/admin`.

## Từ bản v1.5 đang dùng

1. Dừng server v1.5; sao lưu **toàn bộ** thư mục cũ.
2. Sao chép `data/content.json`, `data/students.json`, `data/vocabulary.json` và thư mục `data/uploads` nếu tồn tại từ v1.5 sang thư mục `data/` mới.
3. Không bao giờ đẩy `data/` lên GitHub. `npm run setup` chỉ tạo file còn thiếu, không ghi đè.
4. Chạy lệnh như trên với mật khẩu Admin và cookie secret đã dùng trước đó.
5. Kiểm tra tự động bằng `npm run verify` (không sử dụng dữ liệu thật).

## GitHub mới

Tạo một **private empty repository** trên GitHub (không tick README / License / .gitignore), ví dụ `tieng-trung-an-thoi`.

```powershell
git init
git branch -M main
git add .
git status
git commit -m "chore: establish continuous development baseline"
git remote add origin https://github.com/TEN_GITHUB_CUA_BAN/tieng-trung-an-thoi.git
git push -u origin main
```

Thay `TEN_GITHUB_CUA_BAN`, đăng nhập GitHub theo hướng dẫn Git Credential Manager. Không chia sẻ mật khẩu hoặc token trong chat. Kiểm tra `git status` không chứa `data/` hay `.env` trước commit.

Tài liệu: `docs/ARCHITECTURE.md`, `docs/WORKFLOW.md`. Quy trình kiểm thử CI: `.github/workflows/ci.yml`.
