import React from "react";
import Header from "../../../src/common/components/Header/Header";
import PageLayout from "../../../src/common/components/PageLayout";
import BasicDetailsForm from "../../../src/features/interview/components/BasicDetailsForm";

const DetailsPage = () => {
  return (
    <>
      <Header showFaqs={true} showUserProfile={false} />
      <PageLayout 
        title="Hayalinizdeki işe sadece birkaç adım uzaktasınız."
        subtitle="Devam etmek için aşağıdaki bilgileri doldurun!"
      >
        <BasicDetailsForm />
      </PageLayout>
    </>
  );
};

export default DetailsPage;
