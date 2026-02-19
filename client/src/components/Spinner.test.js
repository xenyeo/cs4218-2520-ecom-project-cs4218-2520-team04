import React from "react";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Spinner from "./Spinner.js";
import { ChildProcess } from "child_process";
import { deserialize } from "v8";

// Mock the navigate function
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/test-path" };

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
    // MemoryRouter: ({ children }) => <div>{children}</div>,
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

// Setup and teardown
beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockClear();
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
});

describe("Spinner Navigation Logic for Default Path when count reaches 0", () => {
    // Test various invalid path values that should all redirect to /login
    test.each([
        ["empty string", ""],
        ["whitespace only", "   "],
        ["double slashes", "dashboard//settings"],
        ["backslashes", "dashboard\\settings"],
        ["path traversal", "../../../etc/passwd"],
        ["multiple path traversal", "....//....//etc/passwd"],
        ["invalid characters", "dashboard!@#"],
        ["spaces in path", "my dashboard"],
        ["leading slash", "/dashboard"],
        ["trailing slash", "dashboard/"],
        ["leading and trailing slashes", "/dashboard/"],
        ["mixed invalid chars", "user@profile#"],
        ["special characters", "path$%^&*"],
        ["dots only", "..."],
        ["dots and slashes", "./././"],
        ["encoded characters", "%2e%2e%2f"],
    ])("should redirect to /login when path contains %s", (_, pathValue) => {
        // Arrange
        render(
            <MemoryRouter>
                <Spinner path={pathValue} />
            </MemoryRouter>
        );
            
        // Act
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        
        // Assert
        expect(mockNavigate).toHaveBeenCalledWith("/login", {
            state: mockLocation.pathname,
        });
    });
});

describe("Spinner Navigation Logic for Custom Path when count reaches 0", () => {
    test.each([
        ["single-level path", "dashboard", "/dashboard"],
        ["nested path", "user/profile", "/user/profile"],
        ["deeply nested path", "admin/settings/page/edit", "/admin/settings/page/edit"],
        ["path with hyphens", "user-profile", "/user-profile"],
        ["path with underscores", "settings_page", "/settings_page"],
        ["mixed hyphens and underscores", "user-profile/settings_page", "/user-profile/settings_page"],
        ["path with numbers", "products/123/edit", "/products/123/edit"],
        ["alphanumeric path", "page2/section3", "/page2/section3"],
        ["single character segments", "a/b/c/d", "/a/b/c/d"],
    ])("should navigate to valid %s: %s → %s", (_, inputPath, expectedPath) => {
        // Arrange
        render(
            <MemoryRouter>
                <Spinner path={inputPath} />
            </MemoryRouter>
        );

        // Act
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        
        // Assert
        expect(mockNavigate).toHaveBeenCalledWith(expectedPath, {
            state: mockLocation.pathname,
        });
    });
});