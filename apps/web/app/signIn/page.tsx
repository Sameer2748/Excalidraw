import React from "react";
import AuthPage from "../../components/AuthPage";
import Checker from "../../hooks/Checker";

const SignIn = () => {
  return (
    <>
      <Checker />
      <AuthPage isSignIn={true} />;
    </>
  );
};

export default SignIn;
