export const m = {
  label: {
    register: "register",
    loginGame: "login",
    close: "close",
    ok: "ok",
    account: "account",
    password: "password",
    passwordRetry: "password again",
    nickName: "nick name",
    guildName: "guild name",
    accountTx: "avatar",
    guildIcon: "guild icon",
    captcha: "captcha",
    select: "select",
    error: "error",
    login: "login",
    saveLoginInfo: "auto login"
  },
  error: {
    code: {
      "403": "Token has expired, please log in again"
    },
    front: {
      register: {
        "0": "Two passwords are different!",
        "1":
          "The account only allows letters, numbers, underscores, minus signs, and requires 2-16 digits!",
        "2":
          "The password only allows letters, numbers, underscores, minus signs, and requires 4-16 digits!",
        "3": "The nickname must be 2-12 characters!",
        "4": "The name of the guild must be 2-12 characters!",
        "5": "Please set an avatar!",
        "6": "Please set the guild icon!",
        "7": "Please enter verification code!"
      }
    },
    backend: {
      register: {
        "0": "Verification code is incorrect!",
        "1":
          "The account only allows letters, numbers, underscores, minus signs, and requires 2-16 digits!",
        "2":
          "The password only allows letters, numbers, underscores, minus signs, and requires 4-16 digits!",
        "3": "The nickname must be 2-12 characters!",
        "4": "The name of the guild must be 2-12 characters!",
        "5": "Image upload failed!",
        "6": "Account already exists",
        "7": "Nickname already exists",
        "8": "Guild name already exists"
      },
      login: {
        "0": "Incorrect verification code!",
        "1": "Please enter account!",
        "2": "Please enter password!",
        "3": "Incorrect account or password!"
      }
    }
  }
};
