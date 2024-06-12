import { NextPage } from "next";

export const ResetPassword: NextPage<{ token: string }> = ({ token }) => {
  return <div>token is : {token}</div>;
};

ResetPassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string, // take the token from the Query string section of URL and pass it to ResetPassword page as props
  };
};

export default ResetPassword;
