'use client'

import React from "react";
import Header from "../../../src/common/components/Header/Header";
import PageLayout from "../../../src/common/components/PageLayout";
import TutorialCard from "../../../src/features/interview/components/TutorialCard";
import { useAppSelector } from "../../../src/common/hooks/useAppDispatch";

const TutorialPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Header showFaqs={true} showUserProfile={true} userName={user?.name || 'Kullanıcı'} />
      <PageLayout 
        title="Yapay Zeka Mülakatınızı Nasıl Tamamlarsınız"
        subtitle="Sorunsuz bir mülakat deneyimi için bu adımları takip edin. Sessiz bir ortam, iyi aydınlatma ve stabil bir internet bağlantınız olduğundan emin olun."
      >
        <TutorialCard />
      </PageLayout>
    </>
  );
};

export default TutorialPage;
