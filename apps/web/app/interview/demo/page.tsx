'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import DemoQuestion from "../../../src/features/interview/components/DemoQuestion";
import PageLayout from "../../../src/common/components/PageLayout";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const DemoPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Header showFaqs={false} showUserProfile={true} userName={user?.name || 'Kullanıcı'} />
      <PageLayout>
        <DemoQuestion />
      </PageLayout>
    </>
  );
};

export default DemoPage;
