import React from "react";
import AuthPage from "../../components/AuthPage";
import Checker from "../../hooks/Checker";

const SignUp = () => {
  return (
    <>
      <Checker where={"signUp"} />
      <AuthPage isSignIn={false} />
    </>
  );
};

export default SignUp;
