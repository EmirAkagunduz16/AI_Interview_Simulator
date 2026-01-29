'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import PageLayout from "../../../src/common/components/PageLayout";
import InstructionsCard from "../../../src/features/interview/components/InstructionsCard";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const InstructionsPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Header showFaqs={true} showUserProfile={true} userName={user?.name || 'Kullanıcı'} />
      <PageLayout 
        title="Mülakat Talimatları"
        subtitle="Mülakatınızı başarıyla tamamlamak için bu yönergeleri takip edin. Her soru türünün belirli bir zaman sınırı vardır."
      >
        <InstructionsCard />
      </PageLayout>
    </>
  );
};

export default InstructionsPage;
