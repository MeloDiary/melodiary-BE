// 중복되지 않은 랜덤 닉네임을 생성하는 함수
import pkg from '@woowa-babble/random-nickname';
import User from '../models/userModel.js';

export const generateUniqueRandomNickname = async (): Promise<string> => {
  const { getRandomNickname } = pkg;
  let randomNickname: string;

  // 조건에 맞는 닉네임이 나올 때까지 최대 100번 반복
  for (let i = 0; i < 100; i++) {
    randomNickname = getRandomNickname('animals');

    // 2~14자 닉네임이 아닐 경우 다시 생성
    if (randomNickname.length < 2 || randomNickname.length > 14) {
      continue;
    }

    const isNicknameExists = await User.isUserExistsByNickname(randomNickname);

    if (isNicknameExists === null) {
      return randomNickname;
    }
  }

  throw new Error('Unable to generate new random nickname');
};
