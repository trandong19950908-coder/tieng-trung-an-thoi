# Quản lý ngân hàng từ vựng

Trong Admin chọn **Ngân hàng từ vựng** → tải CSV mẫu → cập nhật nội dung → nhập tệp.

Các cột bắt buộc theo thứ tự: `id,category,hanzi,pinyin,meaning,example,translation`.

- `id` là mã duy nhất của từ (chữ cái, số, `_`, `-`), không được trùng mã đã tồn tại.
- `category` phải trùng mã chủ đề có sẵn: `hsk1`, `hsk2`, `hsk3`, `hotel`, `taxi`, `restaurant`, `daily`.
- Tệp CSV UTF-8, tối đa 500 KB, 2.000 dòng/lần.
- Có thể xuất CSV sao lưu trước khi cập nhật. Từ đã có tiến độ học viên không nên đổi mã.
- Dữ liệu lưu vào `data/vocabulary.json`, nằm ngoài Git nhờ `.gitignore`. Sao lưu thư mục `data/` định kỳ.
- Nhãn HSK là **tham khảo** cho đến khi giáo viên đối chiếu danh mục HSK 3.0 chính thức.

Tính năng tiếp theo: tạo chủ đề và bài học từ Admin, phân vai giáo viên, chuyển sang cơ sở dữ liệu.
