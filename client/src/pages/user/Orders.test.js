import "@testing-library/jest-dom/extend-expect";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { useAuth } from "../../context/auth";
import Orders from "./Orders";
import React from "react";

jest.mock("axios");

jest.mock("moment", () => () => ({
  fromNow: () => "5 days ago",
}));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenu Mock</div>
));

jest.mock("./../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("fetches orders when auth.token exists and renders order + products", async () => {
    useAuth.mockReturnValue([{ token: "token123" }, jest.fn()]);

    const mockOrders = [
      {
        _id: "o1",
        status: "Processing",
        buyer: { name: "Test Buyer" },
        createdAt: "2026-02-14T00:00:00.000Z",
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "This is a long description for product one",
            price: 10,
          },
          {
            _id: "p2",
            name: "Product 2",
            description: "Another long description for product two",
            price: 20,
          },
        ],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<Orders />);

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    expect(screen.getByText("Test Buyer")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("5 days ago")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByAltText("Product 1")).toBeInTheDocument();
    expect(screen.getByAltText("Product 2")).toBeInTheDocument();

    expect(screen.getByText(/^This is a long description/)).toBeInTheDocument();
    expect(screen.getByText(/^Another long description/)).toBeInTheDocument();

    expect(screen.getByText(/Price\s*:\s*10/i)).toBeInTheDocument();
    expect(screen.getByText(/Price\s*:\s*20/i)).toBeInTheDocument();
  });
});
