'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import VideoQuestion from "../../../src/features/interview/components/VideoQuestion";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const VideoQuestionPage = () => {
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
      <VideoQuestion />
    </>
  );
};

export default VideoQuestionPage;
