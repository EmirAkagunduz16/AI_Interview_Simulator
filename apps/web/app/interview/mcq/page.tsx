'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import McqQuestion from "../../../src/features/interview/components/McqQuestion";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const McqQuestionPage = () => {
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
      <McqQuestion />
    </>
  );
};

export default McqQuestionPage;
