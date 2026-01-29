import React from "react";
import Header from "../../src/common/components/Header/Header";
import FieldSelector from "../../src/features/interview/components/FieldSelector";
import PageLayout from "../../src/common/components/PageLayout";

const SelectFieldPage = () => {
  return (
    <>
      <Header showFaqs={true} showUserProfile={false} />
      <PageLayout>
        <FieldSelector />
      </PageLayout>
    </>
  );
};

export default SelectFieldPage;
