/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getTodayDateKey = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * 날짜 문자열을 Date 객체로 변환
 */
export const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * 주간 식단표에서 오늘의 인덱스 계산
 * @returns {lunchIndex: number, dinnerIndex: number}
 */
export const getTodayMealIndices = (): { lunchIndex: number; dinnerIndex: number } => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  // Convert to 0=Mon, 6=Sun
  const dayIdx = day === 0 ? 6 : day - 1;
  
  return {
    lunchIndex: dayIdx * 2,
    dinnerIndex: dayIdx * 2 + 1,
  };
};

