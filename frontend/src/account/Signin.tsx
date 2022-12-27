import Layout from "../Layout";
import React, { useContext, useEffect, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";

function Signin() {
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");

    const userInfo = useContext(UserContext);
    const navigate = useNavigate()

    useEffect(() => {
        if (userInfo.state.username)
            navigate("/")
    }, [])


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
                error
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


        if (response.data.signin.error) {
            setError(response.data.signin.error);
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

        localStorage.setItem("username", usernameInput);
        localStorage.setItem("sessionToken", sessionToken);
        navigate("/");
    }


    return (
    <Layout>
        <div className = "text-white mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">

            <form onSubmit = {signin} className = "mx-auto border border-black/10 w-fit px-12 py-4 rounded-xl bg-slate-100/10 shadow-md">
                <h1 className = "text-3xl">Sign In</h1>
                <a href = "./register" className = "text-sm text-sky-200 underline">or register here</a>

                <FormInput
                    name = "Username"
                    value = {usernameInput}
                    setValue = {setUsernameInput}
                    mt = "4"
                />

                <FormInput
                    name = "Password"
                    value = {passwordInput}
                    setValue = {setPasswordInput}
                    password = {true}
                />

                <p className = "text-rose-200">{error}</p>
                <button onClick = {signin} className = "py-2 px-4 my-2 border border-black/10 bg-black rounded block">
                    Sign In
                </button>



            </form>

        </div>
    </Layout>)
}

export default Signin;