import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import useAuth from "../hooks/useAuth";
import { useAxios } from "../hooks/useAxios";

const Checkout = () => {
  const { state: cartState, dispatch } = useCart();
  const navigate = useNavigate();
  const { api } = useAxios();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD")

  const [profile, setProfile] = useState(null);
  const { auth } = useAuth();
  const accessToken = auth?.accessToken;

  const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile/");
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    if (accessToken) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [accessToken, api]);

  // Redirect if cart is empty
  if (cartState.items.length === 0) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning text-center">
          <h4>Your cart is empty</h4>
          <p>Add Some items to your cart before proceeding to checkout</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const validateShippingForm = () => {
    const newErrors = {};

    if (!shippingAddress.phone.trim()) newErrors.phone = "Phone is required";
    if (!shippingAddress.address.trim())
      newErrors.address = "Address is required";
    if (!shippingAddress.city.trim()) newErrors.city = "City is required";
    if (!shippingAddress.state.trim()) newErrors.state = "State is required";
    if (!shippingAddress.zipCode.trim())
      newErrors.zipCode = "ZIP code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRazorpayPayment = async () => {
  const loaded = await loadRazorpay();

  if (!loaded) {
    alert("Failed to load Razorpay");
    return;
  }

  try {
    const orderResponse = await api.post(
      "/create-razorpay-order/",
      {
        amount: cartState.total,
      }
    );

    const order = orderResponse.data;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: order.amount,
      currency: order.currency,
      order_id: order.id,

      name: "ClickMart",
      description: "Order Payment",

      handler: async function (response) {
        console.log("Payment Success", response);

        const orderResponse = await api.post(
          "/orders/place/",
          {
            shippingAddress,
            payment_method: "RAZORPAY",
            razorpay_payment_id:
              response.razorpay_payment_id,
          }
        );

        navigate(
          `/order/success/${orderResponse.data.id || ""}`
        );

        dispatch({
          type: "SET_CART",
          payload: {
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
          },
        });
      },

      prefill: {
        email: profile?.email,
        contact: shippingAddress.phone,
      },

      theme: {
        color: "#0d6efd",
      },
    };

    const paymentObject =
      new window.Razorpay(options);

    paymentObject.open();

  } catch (error) {
    console.error(error);
    alert("Payment failed");
  }
};
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShippingForm()) setCurrentStep(2);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await api.post("/orders/place/", {
        shippingAddress: shippingAddress,
        payment_method: "COD",
      });

      if (response.status === 201 || response.status === 200) {
        navigate(`/order/success/${response.data.id || ""}`);
        dispatch({
          type: "SET_CART",
          payload: {
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
          },
        });
      }
    } catch (error) {
      console.error("Order error:", error);
      const errorMsg =
        error.response?.data?.message || "Order placement failed";
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h1 className="display-5 fw-bold">Checkout</h1>
            <div className="d-flex align-items-center mb-3">
              <div
                className={`badge ${
                  currentStep >= 1 ? "bg-primary" : "bg-secondary"
                } me-2`}
              >
                1
              </div>
              <span
                className={
                  currentStep >= 1 ? "text-primary fw-semibold" : "text-muted"
                }
              >
                Shipping
              </span>
              <i className="bi bi-arrow-right mx-2 text-muted"></i>
              <div
                className={`badge ${
                  currentStep >= 2 ? "bg-primary" : "bg-secondary"
                } me-2`}
              >
                2
              </div>
              <span
                className={
                  currentStep >= 2 ? "text-primary fw-semibold" : "text-muted"
                }
              >
                Payment
              </span>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
            {/* STEP 1: SHIPPING FORM */}
            {currentStep === 1 && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Shipping Information</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleShippingSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={profile?.email}
                          disabled
                        />
                        <div className="invalid-feedback">{errors.email}</div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Phone *</label>
                        <input
                          type="tel"
                          className={`form-control ${
                            errors.phone ? "is-invalid" : ""
                          }`}
                          value={shippingAddress.phone}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              phone: e.target.value,
                            })
                          }
                        />
                        <div className="invalid-feedback">{errors.phone}</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address *</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.address ? "is-invalid" : ""
                        }`}
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            address: e.target.value,
                          })
                        }
                      />
                      <div className="invalid-feedback">{errors.address}</div>
                    </div>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.city ? "is-invalid" : ""
                          }`}
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              city: e.target.value,
                            })
                          }
                        />
                        <div className="invalid-feedback">{errors.city}</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.state ? "is-invalid" : ""
                          }`}
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              state: e.target.value,
                            })
                          }
                        />
                        <div className="invalid-feedback">{errors.state}</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">ZIP Code *</label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.zipCode ? "is-invalid" : ""
                          }`}
                          value={shippingAddress.zipCode}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              zipCode: e.target.value,
                            })
                          }
                        />
                        <div className="invalid-feedback">{errors.zipCode}</div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate("/cart")}
                      >
                        <i className="bi bi-arrow-left me-2"></i>Back to Cart
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Continue to Payment{" "}
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* STEP 2: PAYMENT / REVIEW */}
            {currentStep === 2 && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Payment Method</h5>
                </div>
                <div className="card-body text-center py-4">
                  <div className="mb-4">
                    <i className="bi bi-credit-card-2-back display-4 text-muted"></i>
                    <div className="mt-3 text-start">
                      <div className="form-check mb-2">
                        <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <label className="form-check-label">
                          Cash On Delivery (COD)
                          </label>
                      </div>
                          <div className="form-check">
                            <input
                            className="form-check-input"
                            type="radio"
                            name="paymentMethod"
                            value="RAZORPAY"
                            checked={paymentMethod === "RAZORPAY"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <label className="form-check-label">
                              Pay Online (Razorpay)
                              </label>
                          </div>
                    </div>
                  </div>
                  <div className="alert alert-light border text-start">
                    <h6>Shipping to:</h6>
                    <p className="small mb-0">
                      {shippingAddress.address}
                      <br />
                      {shippingAddress.city}, {shippingAddress.state}
                      <br />
                      {shippingAddress.zipCode}</p>
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setCurrentStep(1)}
                    >
                      <i className="bi bi-arrow-left me-2"></i>Back to Shipping
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        if (paymentMethod === "RAZORPAY") {
                          handleRazorpayPayment();
                        } else {
                          handlePaymentSubmit({
                            preventDefault: () => {},
                          });
                        }
                      }}

                    >
                      {isProcessing ? "Processing..." : "Place Order"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: "100px" }}>
              <div className="card-header">
                <h5 className="mb-0">Order Summary</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  {cartState?.items?.map((item) => (
                    <div
                      key={item?.id}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <div className="d-flex align-items-center">
                        <div>
                          <small className="fw-semibold">
                            {item?.product_name}
                          </small>
                          <br />
                          <small className="text-muted">
                            Qty: {item?.quantity}
                          </small>
                        </div>
                      </div>
                      <small className="fw-semibold">
                        ${item?.price * item?.quantity}
                      </small>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>${cartState?.subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Tax:</span>
                  <span>${cartState?.total - cartState?.subtotal}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <strong className="text-primary h5">
                    ${cartState?.total}
                  </strong>
                </div>
                <div className="text-center text-muted">
                  <small>
                    <i className="bi bi-shield-check me-1"></i>Secure checkout
                    with SSL encryption
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
