/**
 * YUYAN Audio System Error Codes & Definitions
 * Error codes AUDIO_001 to AUDIO_010 with technical reason, user message, and recovery action.
 */

import { AudioServiceError } from './audioTypes';

export const AUDIO_ERRORS: Record<string, (details?: string) => AudioServiceError> = {
  AUDIO_001: (details) => ({
    code: 'AUDIO_001',
    technicalReason: details || 'No audio source or file could be resolved for the requested entity.',
    userMessage: 'Chưa có file âm thanh cho nội dung này.',
    recoveryAction: 'Chuyển sang sử dụng giọng đọc trình duyệt hoặc kiểm tra dữ liệu bài học.',
  }),
  AUDIO_002: (details) => ({
    code: 'AUDIO_002',
    technicalReason: details || 'Browser SpeechSynthesis API is not supported or disabled in this browser context.',
    userMessage: 'Trình duyệt hiện tại không hỗ trợ phát âm tự động.',
    recoveryAction: 'Vui lòng sử dụng trình duyệt hiện đại như Chrome, Edge hoặc Safari.',
  }),
  AUDIO_003: (details) => ({
    code: 'AUDIO_003',
    technicalReason: details || 'No Chinese (zh-CN / zh) voice found in speechSynthesis.getVoices(). Strict policy forbids non-Chinese fallback.',
    userMessage: 'Thiết bị chưa có giọng đọc tiếng Trung phù hợp.',
    recoveryAction: 'Vui lòng cài đặt gói ngôn ngữ tiếng Trung (Simplified Chinese) trong cài đặt Text-to-Speech của hệ điều hành.',
  }),
  AUDIO_004: (details) => ({
    code: 'AUDIO_004',
    technicalReason: details || 'Network request to fetch audio asset failed or timed out.',
    userMessage: 'Không thể tải file âm thanh do lỗi kết nối mạng.',
    recoveryAction: 'Kiểm tra kết nối internet và thử lại.',
  }),
  AUDIO_005: (details) => ({
    code: 'AUDIO_005',
    technicalReason: details || 'Audio provider failed to generate or return playable stream.',
    userMessage: 'Dịch vụ phát âm tạm thời không khả dụng.',
    recoveryAction: 'Thử lại sau ít phút hoặc chuyển sang chế độ tự luyện nói.',
  }),
  AUDIO_006: (details) => ({
    code: 'AUDIO_006',
    technicalReason: details || 'Audio element received invalid format, corrupted bytes, or decoding error.',
    userMessage: 'Định dạng file âm thanh không hợp lệ.',
    recoveryAction: 'Báo cáo quản trị viên hoặc sử dụng giọng đọc thay thế.',
  }),
  AUDIO_007: (details) => ({
    code: 'AUDIO_007',
    technicalReason: details || 'Autoplay policy blocked playback before user interaction.',
    userMessage: 'Trình duyệt yêu cầu tương tác trước khi phát âm thanh.',
    recoveryAction: 'Bấm nút phát một lần nữa để cho phép phát âm thanh.',
  }),
  AUDIO_008: (details) => ({
    code: 'AUDIO_008',
    technicalReason: details || 'User denied microphone permission or device has no microphone attached.',
    userMessage: 'Ứng dụng chưa được cấp quyền sử dụng microphone.',
    recoveryAction: 'Cho phép quyền truy cập microphone trên thanh địa chỉ trình duyệt để luyện nói.',
  }),
  AUDIO_009: (details) => ({
    code: 'AUDIO_009',
    technicalReason: details || 'MediaRecorder API is not available or failed to start recording.',
    userMessage: 'Không thể khởi tạo bộ ghi âm trên thiết bị này.',
    recoveryAction: 'Kiểm tra thiết bị thu âm hoặc nâng cấp trình duyệt.',
  }),
  AUDIO_010: (details) => ({
    code: 'AUDIO_010',
    technicalReason: details || 'Playback was aborted because a newer audio request was dispatched.',
    userMessage: 'Đã hủy phát do yêu cầu âm thanh mới.',
    recoveryAction: 'Không cần thao tác; hệ thống tự động phát nội dung mới.',
  }),
};
