// Import GVHD chỉ bắt buộc cột "Tên đầy đủ". Row chưa có Email được BE cấp một email
// giữ chỗ trên domain không tồn tại (LecturerPlaceholderEmail.Domain) để tạo được account.
// Email đó không login được và không nên hiển thị như email thật.
export const PLACEHOLDER_EMAIL_DOMAIN = 'chua-co-email.local';

export const isPlaceholderEmail = (email?: string | null): boolean =>
  !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
