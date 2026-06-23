import React from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import useLoginActions from "../useLoginActions";
import { AuthContext } from "../../contexts/AuthContext";

jest.mock("../../contexts/AuthContext", () => {
  const ReactModule = require("react");
  return {
    AuthContext: ReactModule.createContext({
      signIn: jest.fn(),
      signInWithGoogle: jest.fn(),
      googleAuthLoading: false,
    }),
  };
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("../../storage/tokenStorage", () => ({
  tokenStorage: {
    getRememberPreference: jest.fn().mockResolvedValue(false),
    setRememberPreference: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../utils/authActivation", () => ({
  getActivationEmail: jest.fn((error, fallbackEmail) => fallbackEmail),
  isActivationRequiredError: jest.fn(() => false),
  openActivationOtp: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("react-i18next", () => {
  const dictionary = {
    "auth.login.failedTitle": "Dang nhap that bai",
    "auth.login.failedMessage": "Khong the dang nhap",
    "auth.signup.missingTitle": "Thieu thong tin",
    "auth.login.missingCredentials": "Vui long nhap day du email va mat khau.",
    "auth.login.connectionErrorTitle": "Khong ket noi duoc voi may chu",
    "auth.login.connectionErrorMsg": "Vui long kiem tra ket noi mang va thu lai.",
  };

  return {
    useTranslation: () => ({
      t: (key) => dictionary[key] || key,
    }),
  };
});

function LoginActionsHarness() {
  const { email, setEmail, password, setPassword, onSubmit, onGooglePress } = useLoginActions();

  return (
    <View>
      <TextInput testID="username-input" value={email} onChangeText={setEmail} />
      <TextInput testID="password-input" value={password} onChangeText={setPassword} />
      <Pressable testID="login-button" onPress={onSubmit}>
        <Text>Dang nhap</Text>
      </Pressable>
      <Pressable testID="google-button" onPress={onGooglePress}>
        <Text>Google</Text>
      </Pressable>
    </View>
  );
}

describe("useLoginActions", () => {
  const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

  let signInMock;

  const setupComponent = () => {
    return render(
      <AuthContext.Provider
        value={{
          user: null,
          isBootstrapping: false,
          signIn: signInMock,
          signInWithGoogle: jest.fn(),
          googleAuthLoading: false,
          signOut: jest.fn(),
          refreshUser: jest.fn(),
        }}
      >
        <LoginActionsHarness />
      </AuthContext.Provider>
    );
  };

  const performLogin = (getByTestId, username, password) => {
    fireEvent.changeText(getByTestId("username-input"), username);
    fireEvent.changeText(getByTestId("password-input"), password);
    fireEvent.press(getByTestId("login-button"));
  };

  beforeEach(() => {
    signInMock = jest.fn();
    jest.clearAllMocks();
  });

  test("should not attempt login when email is missing", async () => {
    const { getByTestId } = setupComponent();
    fireEvent.changeText(getByTestId("username-input"), "");
    fireEvent.changeText(getByTestId("password-input"), "somepassword");
    fireEvent.press(getByTestId("login-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Thieu thong tin",
        "Vui long nhap day du email va mat khau."
      );
    });

    expect(signInMock).not.toHaveBeenCalled();
  });

  test("should not attempt login when password is missing", async () => {
    const { getByTestId } = setupComponent();
    fireEvent.changeText(getByTestId("username-input"), "admin@test.com");
    fireEvent.changeText(getByTestId("password-input"), "");
    fireEvent.press(getByTestId("login-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Thieu thong tin",
        "Vui long nhap day du email va mat khau."
      );
    });

    expect(signInMock).not.toHaveBeenCalled();
  });

  test("should show connection error on timeout", async () => {
    signInMock.mockRejectedValueOnce({ code: "ECONNABORTED" });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "admin", "password123");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Khong ket noi duoc voi may chu",
        "Vui long kiem tra ket noi mang va thu lai."
      );
    });
  });

  test("should show connection error on network failure", async () => {
    signInMock.mockRejectedValueOnce({
      message: "Network request failed",
    });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "admin", "password123");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Khong ket noi duoc voi may chu",
        "Vui long kiem tra ket noi mang va thu lai."
      );
    });
  });

  test("should show connection error on 503 service unavailable", async () => {
    signInMock.mockRejectedValueOnce({
      response: { status: 503, data: {} },
    });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "admin", "password123");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Khong ket noi duoc voi may chu",
        "Vui long kiem tra ket noi mang va thu lai."
      );
    });
  });

  test("should login successfully with correct credentials", async () => {
    signInMock.mockResolvedValueOnce({ id: 1, username: "admin" });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "admin", "password123");

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "admin",
        password: "password123",
        rememberMe: false,
      });
    });

    expect(alertSpy).not.toHaveBeenCalled();
  });

  test("should show error message with invalid credentials", async () => {
    signInMock.mockRejectedValueOnce({
      response: {
        data: { message: "Tai khoan hoac mat khau khong dung" },
      },
    });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "wrong", "wrong");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Dang nhap that bai",
        "Tai khoan hoac mat khau khong dung"
      );
    });
  });

  test("should show activation dialog when 403 and activation required", async () => {
    const isActivationRequiredError = require("../../utils/authActivation").isActivationRequiredError;
    isActivationRequiredError.mockReturnValueOnce(true);

    signInMock.mockRejectedValueOnce({
      response: { status: 403, data: { needsActivation: true } },
    });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "unactivated@test.com", "password123");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  test("should show error when google sign-in fails", async () => {
    const signInWithGoogle = jest.fn().mockRejectedValueOnce({
      response: { data: { message: "Google login failed" } },
    });

    const { getByTestId } = render(
      <AuthContext.Provider
        value={{
          user: null,
          isBootstrapping: false,
          signIn: signInMock,
          signInWithGoogle,
          googleAuthLoading: false,
          signOut: jest.fn(),
          refreshUser: jest.fn(),
        }}
      >
        <LoginActionsHarness />
      </AuthContext.Provider>
    );

    fireEvent.press(getByTestId("google-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Dang nhap that bai",
        "Google login failed"
      );
    });
  });

  test("should show error message when account is locked", async () => {
    signInMock.mockRejectedValueOnce({
      response: {
        data: { message: "Tai khoan cua ban da bi khoa" },
      },
    });

    const { getByTestId } = setupComponent();
    performLogin(getByTestId, "lockedUser", "password");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Dang nhap that bai",
        "Tai khoan cua ban da bi khoa"
      );
    });
  });
});
