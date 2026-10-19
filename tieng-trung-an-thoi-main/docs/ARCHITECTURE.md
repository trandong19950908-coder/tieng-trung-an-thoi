# Kiến trúc dự án chính

- `public/`: giao diện đang chạy, giữ các API cũ.
- `server/index.js`: API Node thuần hiện tại (legacy compatibility layer).
- `src/modules/learning-methods/`: tài liệu/phương pháp học, âm thanh, shadowing (dự kiến).
- `src/modules/vocabulary/`: danh mục HSK/chuyên ngành, bài học, SRS, đánh giá (một phần đang hoạt động).
- `src/modules/hsk-exam/`: đề, phiên thi, đồng hồ, chấm điểm, kết quả (chưa triển khai).
- `src/modules/admissions/`: đăng ký, tư vấn, lịch khai giảng, CRM (đang hoạt động một phần).
- `content/vocabulary.json`: bộ từ vựng khởi tạo; học liệu biên soạn tham khảo, không chứng nhận danh mục HSK 3.0.
- `content/site.seed.json`: dữ liệu demo không phải dữ liệu học viên thực.
- `data/`: dữ liệu runtime (students.json, content.json, uploads, vocabulary.json), luôn nằm ngoài Git.
- `scripts/bootstrap.js`: khởi tạo dữ liệu lần đầu, không ghi đè dữ liệu đang có.
- `tests/`: kiểm thử tự động, dùng thư mục tạm nên không đụng dữ liệu thật.

## Nguyên tắc mở rộng

1. Mỗi mô-đun có API và mô hình dữ liệu riêng; trước mắt vẫn giữ endpoint v1.5.
2. Di chuyển route dần sang thư mục mô-đun, tránh viết lại toàn bộ trong một lần.
3. Cần migration có version trước khi chuyển JSON sang PostgreSQL; backup và rollback là bắt buộc.
4. Phân quyền học viên / giáo viên / quản trị; nhật ký thao tác, rate-limit và chống CSRF trước triển khai Internet.
5. HSK 3.0 là nhãn nội dung cần kiểm chứng từ đề cương chính thức; không sao chép nguyên sách thương mại.
6. Phòng thi HSK là mô phỏng, không tự nhận là hệ thống thi chính thức.
