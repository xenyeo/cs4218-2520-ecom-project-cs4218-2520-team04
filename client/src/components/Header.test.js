// Yeo Yi Wen, A0273575U
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";

import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import SearchInput from "./Form/SearchInput";
import toast from "react-hot-toast";

// Required mocks for to render Header component without errors: useAuth, useCart, useCategory, SearchInput
// Mock useAuth()
jest.mock("../context/auth", () => ({
    useAuth: jest.fn()
}));

// Mock useCart()
jest.mock("../context/cart", () => ({
    useCart: jest.fn()
}));

// Mock useCategory()
jest.mock("../hooks/useCategory", () => jest.fn());

// Mock <SearchInput />
jest.mock("./Form/SearchInput", () => () => <div>SearchInput Mock</div>);

// Mock localStorage
const localStorageMock = (() => {
    let storage = {};
    return {
        getItem: jest.fn((key) => storage[key] || null),
        removeItem: jest.fn((key) => { delete storage[key]; }),
        setItem: jest.fn((key, value) => { storage[key] = value.toString(); }),
    };
})();

// Mock toast
jest.mock("react-hot-toast", () => ({
    success: jest.fn()
}));

// Override the global localStorage with localStorageMock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe("handleLogout logic when a valid user is logged in and logout button is clicked", () => {
    // Arrange: Mock variables for auth context
    let mockAuth;
    let mockSetAuth;

    // Arrange & Act: Mock dependencies before each test (Simulate logged-in user clicking logout button)
    beforeEach(() => {
        jest.clearAllMocks();
    
        // Simulate a logged-in user with name "John Doe" and role 0 (regular user)
        mockAuth = { 
            user: { name: "John Doe", role: 0 }, 
            token: "mockToken" 
        };
        
        // Mock setAuth function to update auth when called
        mockSetAuth = jest.fn((newAuth) => {
            mockAuth = newAuth;
            // Update the mock return value of useAuth to reflect the new auth state
            useAuth.mockReturnValue([mockAuth, mockSetAuth]);
        });
        
        // mocks [auth, setAuth] = useAuth()
        useAuth.mockReturnValue([mockAuth, mockSetAuth]);
        
        // mocks [cart] = useCart()
        useCart.mockReturnValue([[], jest.fn()]);

        // mocks categories = useCategory()
        useCategory.mockReturnValue([]);
        
        // Simulate auth item in localStorage when user is logged in
        localStorageMock.setItem("auth", JSON.stringify(mockAuth));

        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );

        // Simulate user clicking the logout button
        const userDropdown = screen.getByText("John Doe");
        fireEvent.click(userDropdown);

        const logoutButton = screen.getByText("Logout");
        fireEvent.click(logoutButton);    
    });
    
    // Assert
    test("setAuth should be called once to set user to null and token to an empty string", () => { 
        expect(mockSetAuth).toHaveBeenCalledTimes(1);
        expect(mockSetAuth).toHaveBeenCalledWith({
            user: null,
            token: ""
        });
    });

    test("auth name should be null", () => {
        expect(mockAuth.user).toBeNull();
    });

    test("auth token should be an empty string", () => {
        expect(mockAuth.token).toBe("");
    });

    test("localStorage.removeItem should be called once with 'auth'", () => {
        expect(localStorageMock.removeItem).toHaveBeenCalledTimes(1);
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth");
    });

    test("auth item should be removed from localStorage", () => {
        expect(localStorageMock.getItem("auth")).toBeNull();
    });

    test("toast.success should be called once with 'Logout Successfully'", () => {
        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });
});