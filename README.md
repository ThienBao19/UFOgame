# 🛸 UFO Gọi Bài

Trò chơi gọi học sinh lên bảng trả bài cho lớp học: một chiếc UFO bay tới sân trường, lia đèn tìm kiếm rồi dùng tia sáng "bắt cóc" ngẫu nhiên các bạn lên bảng.

Toàn bộ hình ảnh được vẽ bằng Canvas và âm thanh tổng hợp bằng Web Audio — không có file ảnh/âm thanh, không cần build.

## Chạy

- Mở trực tiếp `index.html` bằng Chrome/Edge, **hoặc**
- Chạy server tĩnh: `python -m http.server 3400` rồi mở http://localhost:3400

## Tính năng

- Nhập danh sách lớp (mỗi dòng một tên, dán từ Excel được), đặt tên lớp
- Gọi 1–5 bạn mỗi lượt, chọn ngẫu nhiên công bằng (`crypto.getRandomValues`)
- Chế độ không gọi lại bạn đã lên bảng cho tới khi cả lớp hết lượt
- Lịch sử gọi bài, tự lưu bằng `localStorage`
- Phím tắt: `Space` gọi UFO · `↑`/`↓` số bạn · `F` toàn màn hình · `M` âm thanh

## Cấu trúc

```
index.html        giao diện HUD, bảng danh sách, thẻ kết quả
css/style.css     style
js/util.js        hằng số layout, helper, tween engine
js/audio.js       hiệu ứng âm thanh Web Audio
js/vehicles.js    xe cộ trên đường
js/background.js  phố đêm, nhà ống, sân trường (vẽ sẵn 1 lần)
js/student.js     nhân vật học sinh + AI đi lại / hoảng loạn
js/ufo.js         đĩa bay, đèn rọi, tia hút
js/director.js    kịch bản một lượt gọi
js/ui.js          DOM UI, lưu trữ, phím tắt
js/main.js        vòng lặp game và render
```

## Deploy

Site tĩnh, deploy thẳng lên Vercel (cấu hình trong `vercel.json`, không có bước build).