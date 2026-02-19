// Profile.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Profile from "./Profile"; // adjust path if needed
import { useAuth } from "../../context/auth";
import axios from "axios";
import toast from "react-hot-toast";

// ---- Mocks ----
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenu Mock</div>
));

jest.mock("./../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("Profile Component", () => {
  const setAuthMock = jest.fn();

  const baseAuth = {
    user: {
      name: "Test User",
      email: "test@mail.com",
      phone: "12345678",
      address: "Test Address",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: auth present
    useAuth.mockReturnValue([baseAuth, setAuthMock]);

    // Safe localStorage mock (simple in-memory store)
    let store = {};
    jest.spyOn(window.localStorage.__proto__, "getItem").mockImplementation((k) =>
      Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null
    );
    jest.spyOn(window.localStorage.__proto__, "setItem").mockImplementation((k, v) => {
      store[k] = String(v);
    });

    // Seed auth in localStorage (matches your component’s expectation)
    window.localStorage.setItem("auth", JSON.stringify(baseAuth));
  });

  it("renders layout + user menu + form title", () => {
    render(<Profile />);
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    expect(screen.getByText(/USER PROFILE/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /UPDATE/i })).toBeInTheDocument();
  });

  it("prefills inputs from auth.user via useEffect (email is test@mail.com and disabled)", async () => {
    render(<Profile />);

    const nameInput = await screen.findByPlaceholderText(/Enter Your Name/i);
    const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
    const phoneInput = screen.getByPlaceholderText(/Enter Your Phone/i);
    const addressInput = screen.getByPlaceholderText(/Enter Your Address/i);

    expect(nameInput).toHaveValue("Test User");
    expect(emailInput).toHaveValue("test@mail.com");
    expect(phoneInput).toHaveValue("12345678");
    expect(addressInput).toHaveValue("Test Address");

    expect(emailInput).toBeDisabled();
  });

  it("allows editing name/phone/address/password (email remains disabled)", async () => {
    render(<Profile />);

    const nameInput = await screen.findByPlaceholderText(/Enter Your Name/i);
    const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter Your Password/i);
    const phoneInput = screen.getByPlaceholderText(/Enter Your Phone/i);
    const addressInput = screen.getByPlaceholderText(/Enter Your Address/i);

    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.change(passwordInput, { target: { value: "newpass" } });
    fireEvent.change(phoneInput, { target: { value: "87654321" } });
    fireEvent.change(addressInput, { target: { value: "New Address" } });

    expect(nameInput).toHaveValue("New Name");
    expect(passwordInput).toHaveValue("newpass");
    expect(phoneInput).toHaveValue("87654321");
    expect(addressInput).toHaveValue("New Address");

    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue("test@mail.com");
  });

  it("submits and calls axios.put with the latest state (email fixed as test@mail.com)", async () => {
    axios.put.mockResolvedValueOnce({
      data: { updatedUser: { ...baseAuth.user, name: "Updated User" } },
    });

    render(<Profile />);

    const nameInput = await screen.findByPlaceholderText(/Enter Your Name/i);
    const passwordInput = screen.getByPlaceholderText(/Enter Your Password/i);
    const phoneInput = screen.getByPlaceholderText(/Enter Your Phone/i);
    const addressInput = screen.getByPlaceholderText(/Enter Your Address/i);

    fireEvent.change(nameInput, { target: { value: "Updated User" } });
    fireEvent.change(passwordInput, { target: { value: "pw123" } });
    fireEvent.change(phoneInput, { target: { value: "11112222" } });
    fireEvent.change(addressInput, { target: { value: "Updated Addr" } });

    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

    expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
      name: "Updated User",
      email: "test@mail.com",
      password: "pw123",
      phone: "11112222",
      address: "Updated Addr",
    });
  });

  it("on success: updates auth context, updates localStorage, shows success toast", async () => {
    const updatedUser = { ...baseAuth.user, name: "Updated User", phone: "99990000" };

    axios.put.mockResolvedValueOnce({
      data: { updatedUser },
    });

    render(<Profile />);

    const nameInput = await screen.findByPlaceholderText(/Enter Your Name/i);
    fireEvent.change(nameInput, { target: { value: "Updated User" } });

    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully")
    );

    expect(setAuthMock).toHaveBeenCalledWith({ ...baseAuth, user: updatedUser });

    const ls = JSON.parse(window.localStorage.getItem("auth"));
    expect(ls.user).toEqual(updatedUser);
  });

  it("if API responds with data.errro truthy: shows error toast and does not update auth", async () => {
    axios.put.mockResolvedValueOnce({
      data: { errro: true, error: "Bad request" },
    });

    render(<Profile />);

    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Bad request"));

    expect(setAuthMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("if axios throws: shows generic error toast", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.put.mockRejectedValueOnce(new Error("Network error"));

    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

    await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    );

    logSpy.mockRestore();
  });

  it("handles missing auth.user gracefully (does not crash)", () => {
    useAuth.mockReturnValue([{}, setAuthMock]);

    expect(() => render(<Profile />)).not.toThrow();

    expect(screen.getByText(/USER PROFILE/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /UPDATE/i })).toBeInTheDocument();
  });
});
