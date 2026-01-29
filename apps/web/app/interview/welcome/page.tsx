import React from "react";
import Header from "../../../src/common/components/Header/Header";
import PageLayout from "../../../src/common/components/PageLayout";
import WelcomeCard from "../../../src/features/interview/components/WelcomeCard";

const WelcomePage = () => {
  return (
    <>
      <Header showFaqs={true} showUserProfile={false} />
      <PageLayout 
        title="Hoş Geldiniz" 
        subtitle="Mülakat davetimize katıldığınız için teşekkür ederiz."
        emoji="👋"
      >
        <WelcomeCard />
      </PageLayout>
    </>
  );
};

export default WelcomePage;
