# Phát triển liên tục, giảm kiểm thử thủ công

- Một kho mã nguồn chính `main`; mỗi tính năng ở nhánh `feat/<ten>`; mở Pull Request.
- Trước khi merge: `npm run verify`; GitHub Actions chạy lại kiểm thử mỗi push/PR.
- Bản chưa hoàn thiện dùng nhánh `develop` hoặc feature branch; không phát ZIP theo chức năng.
- Mỗi mô-đun có checklist nghiệp vụ trong PR; cập nhật fixture và unit/integration tests.
- Chỉ yêu cầu người dùng nghiệm thu trực tiếp ở hai mốc: bản tích hợp bốn mô-đun và bản trước triển khai Internet.
- Không đưa dữ liệu cá nhân, `.env`, ảnh học viên thật, khóa API vào repository; dùng GitHub Secrets khi cần.
- Không triển khai tự động công khai từ bản demo; cần nâng cấp DB, phiên đăng nhập và bảo vệ dữ liệu trước.

## Lộ trình

1. Chuẩn hóa tài khoản, lưu tiến độ, data migration; admin quản lý học liệu và nhập CSV.
2. Lộ trình HSK 1–3 và từ vựng ngành dịch vụ; ôn ngắt quãng, luyện nghe/chọn nghĩa/chữ Hán.
3. Phòng thi HSK mô phỏng (mock sessions, đếm giờ, autosave, câu hỏi có nguồn hợp lệ).
4. Đánh giá đầu vào, tư vấn, CRM và phân tích chuyển đổi.
5. Kiểm thử tích hợp -> sửa lỗi -> kiểm thử nghiệm thu, bảo mật, triển khai.
