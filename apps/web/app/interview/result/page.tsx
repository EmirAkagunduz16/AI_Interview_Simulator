'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import ResultCard from "../../../src/features/interview/components/ResultCard";
import PageLayout from "../../../src/common/components/PageLayout";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const ResultPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Header showFaqs={false} showUserProfile={true} userName={user?.name || 'Kullanıcı'} />
      <PageLayout>
        <ResultCard />
      </PageLayout>
    </>
  );
};

export default ResultPage;
