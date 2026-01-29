'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import CodingQuestion from "../../../src/features/interview/components/CodingQuestion";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const CodingQuestionPage = () => {
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
      <CodingQuestion />
    </>
  );
};

export default CodingQuestionPage;
