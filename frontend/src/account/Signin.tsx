import Layout from "../Layout";
import React, { useContext, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";

function Signin() {
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");

    const userInfo = useContext(UserContext);
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();


    const signin = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError("");

        if (usernameInput === "" || passwordInput === "") {
            setError("Please fill in all fields");
            return;
        }


        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            signin(username: "${usernameInput}", password: "${passwordInput}") {
                msg
                sessionToken
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)

        if (response.data.signin.msg !== "Success") {
            setError(response.data.signin.msg);
            return;
        }

        const sessionToken = response.data.signin.sessionToken;
        if (!sessionToken) {
            setError("Invalid username or password");
            return;
        }

        userInfo.dispatch({type: "UPDATE", payload: {
            username: usernameInput, 
            sessionToken: sessionToken}
        });

        localStorage.setItem("username", usernameInput.toLowerCase());
        localStorage.setItem("sessionToken", sessionToken);

        navigate(searchParams.get("return") ?? "/");


    }

    return (
    <Layout>
        <div className = "text-white mt-16 mx-auto w-11/12 md:w-3/4 mb-4">
            {userInfo.state.username ?
            <div className = "mx-auto w-fit">
                <p>Already signed in.</p>
                <button onClick = {() => { userInfo.dispatch({type: "SIGNOUT"}) }} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/20 rounded-xl block border border-black/50">
                    Sign Out
                </button>
            </div>
            :
            <div className = "grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit = {signin} className = "mx-auto w-11/12 px-12 py-4 rounded-xl bg-black/20 shadow-md">
                    <h1 className = "text-2xl text-center">Sign In</h1>

                    <div className = "w-11/12 md:w-4/5 lg:w-3/4 mx-auto mb-10">
                        <FormInput
                            name = "Username"
                            value = {usernameInput}
                            setValue = {setUsernameInput}
                            marginTop = "48px"
                            valid = {usernameInput !== ""}
                        />

                        <FormInput
                            name = "Password"
                            value = {passwordInput}
                            setValue = {setPasswordInput}
                            password = {true}
                            marginTop = "36px"
                            valid = {passwordInput !== ""}
                        />
                    </div>

                    <p className = "text-rose-200 my-4 text-center">{error}</p>
                    <button onClick = {signin} className = "text-sm text-black px-8 py-2 mx-auto mb-2 bg-sky-200/80 rounded-xl block border border-black/50">
                        Sign In
                    </button>

                </form>
                <div className = "mx-auto w-11/12 px-12 py-4 rounded-xl flex items-center justify-center bg-black/20 shadow-md text-center">
                    <div>
                        Welcome back to Chirp Boards!

                        <div className = "mt-2">
                            Need an account?
                            <a href = "/register" className = "text-sky-200">
                                {" Register here"}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            }

        </div>
    </Layout>)
}

export default Signin;