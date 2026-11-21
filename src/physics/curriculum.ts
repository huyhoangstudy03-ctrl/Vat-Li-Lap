import { LESSONS_GRADE_10 } from './curriculum10';
import { LESSONS_GRADE_11 } from './curriculum11';
import { LESSONS_GRADE_12 } from './curriculum12';
import { LessonId, ParamMap, PhysicsLesson } from './types';

export const ALL_LESSONS: PhysicsLesson[] = [
  ...LESSONS_GRADE_10,
  ...LESSONS_GRADE_11,
  ...LESSONS_GRADE_12,
];

export const LESSON_BY_ID: Record<LessonId, PhysicsLesson> = ALL_LESSONS.reduce(
  (acc, lesson) => {
    acc[lesson.id] = lesson;
    return acc;
  },
  {} as Record<LessonId, PhysicsLesson>
);

export function getDefaultParams(lesson: PhysicsLesson): ParamMap {
  return lesson.parameters.reduce((acc, p) => {
    acc[p.key] = p.defaultValue;
    return acc;
  }, {} as ParamMap);
}

export const GLOBAL_REFERENCES = [
  {
    category: 'Sách giáo khoa chính thống (Chương trình GDPT 2018)',
    items: [
      {
        title: 'Bộ SGK Vật lí 10, 11, 12 — Kết nối tri thức với cuộc sống',
        authors: 'Vũ Văn Hùng (Tổng Chủ biên) & tập thể tác giả',
        publisher: 'Nhà xuất bản Giáo dục Việt Nam',
        note: 'Nguồn chuẩn xác định ký hiệu đại lượng, quy ước dấu (ΔU = A + Q) và cấu trúc chương trình thi Tốt nghiệp THPT từ năm 2025.',
      },
      {
        title: 'Bộ SGK Vật lí 10, 11, 12 — Chân trời sáng tạo & Cánh diều',
        authors: 'Bộ Giáo dục và Đào tạo thẩm định',
        publisher: 'NXB Giáo dục Việt Nam / NXB Đại học Sư phạm',
        note: 'Đối chiếu song song các cách tiếp cận bài tập vận dụng và đồ thị thực nghiệm.',
      },
    ],
  },
  {
    category: 'Giáo trình đại học & Phòng thí nghiệm mô phỏng kiểm chuẩn quốc tế',
    items: [
      {
        title: 'Fundamentals of Physics (11th Edition)',
        authors: 'David Halliday, Robert Resnick, Jearl Walker',
        publisher: 'John Wiley & Sons',
        note: 'Tài liệu nền tảng đối chiếu các định luật bảo toàn, điện từ học và cơ sở vật lí lượng tử.',
      },
      {
        title: 'University Physics Volumes 1, 2 & 3',
        authors: 'Samuel J. Ling, Jeff Sanny, William Moebs',
        publisher: 'OpenStax — Rice University',
        note: 'Bộ giáo trình truy cập mở được thẩm định ngang hàng, dùng kiểm tra độ chính xác công thức và phương trình vi phân.',
      },
      {
        title: 'PhET Interactive Simulations — Physics Collection',
        authors: 'Carl Wieman & University of Colorado Boulder',
        publisher: 'University of Colorado Boulder',
        note: 'Tham chiếu chuẩn mực sư phạm cho mô phỏng trực quan cơ học, quang học, khí lí tưởng và lượng tử.',
      },
    ],
  },
];
