'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import AudioQuestion from "../../../src/features/interview/components/AudioQuestion";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const AudioQuestionPage = () => {
  const { timeRemaining } = useAppSelector((state) => state.interview);
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Header 
        showFaqs={false} 
        showTimer={true} 
        showUserProfile={true} 
        userName={user?.name || 'Kullanıcı'}
        timeRemaining={timeRemaining}
      />
      <AudioQuestion />
    </>
  );
};

export default AudioQuestionPage;
