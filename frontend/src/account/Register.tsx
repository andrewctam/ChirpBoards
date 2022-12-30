import Layout from "../Layout";
import React, { useContext, useEffect, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";

function Register() {
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [repeatPasswordInput, setRepeatPasswordInput] = useState("");
    const [displayNameInput, setDisplayNameInput] = useState("");
    const [error, setError] = useState("");
    const userInfo = useContext(UserContext);

    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (userInfo.state.username)
            setError("Already logged in")
    }, [])
    
    const register = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError("");

        if (usernameInput === "" || passwordInput === "") {
            setError("Please fill in all fields");
            return;
        }

        if (usernameInput.length < 3 || usernameInput.length > 16) {
            setError("Username must be between 3 and 16 characters");
            return;
        }

        if (passwordInput.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        
        //regex for only letters and numbers
        if (! (/^[a-zA-Z0-9]+$/.test(usernameInput)) ) {
            setError("Username can only contain letters and numbers");
            return;
        }

        if (repeatPasswordInput === "") {
            setError("Please retype your password");
            return;
        }
        
        if (passwordInput !== repeatPasswordInput) {
            setError("Passwords do not match");
            return;
        }


        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            register(username: "${usernameInput}", displayName:"${displayNameInput ? displayNameInput : usernameInput}" password: "${passwordInput}") {
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

        if (response.data.register.msg) {
            setError(response.data.register.msg);
            return;
        }

        const sessionToken = response.data.register.sessionToken;

        if (!sessionToken) {
            setError("Error creating account");
            return;
        }

        userInfo.dispatch({type: "UPDATE", payload: {
            username: usernameInput, 
            sessionToken: sessionToken}
        });

        localStorage.setItem("username", usernameInput);
        localStorage.setItem("sessionToken", sessionToken);
        if (searchParams && searchParams.get("return") === "true") {
            navigate(-1);
        } else
            navigate("/");
    }


    return (
    <Layout>
        <div className = "text-white mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            {userInfo.state.username ?
            <div className = "mx-auto w-fit">
                <p>Already signed in.</p>
                <button onClick = {() => { userInfo.dispatch({type: "SIGNOUT"}) }} className = "py-2 px-4 my-2 w-full border border-black/10 bg-black rounded block">
                    Sign Out
                </button>
            </div>
            :
            <form onSubmit={register} className = "mx-auto border border-black/10 w-1/2 px-12 py-4 rounded-xl bg-slate-100/10 shadow-md">
                <h1 className = "text-3xl text-center">Register</h1>
                <a href = "/signin">
                    <p className = "text-sm text-sky-300 underline text-center">
                        or sign in here
                    </p>
                </a>

                <FormInput
                    name = "Username"
                    value = {usernameInput}
                    setValue = {setUsernameInput}
                    mt = "4"
                />

                <FormInput
                    name = "Display Name"
                    value = {displayNameInput}
                    setValue = {setDisplayNameInput}
                    placeholder = {usernameInput}
                />


                <FormInput
                    name = "Password"
                    value = {passwordInput}
                    setValue = {setPasswordInput}
                    password = {true}
                    mt = "8"
                />

                <FormInput
                    name = "Repeat Password"
                    value = {repeatPasswordInput}
                    setValue = {setRepeatPasswordInput}
                    placeholder = ""
                    password = {true}
                />

                <p className = "text-rose-200 break-words">{error}</p>

                <button onClick = {register} className = "py-2 px-4 mb-2 mt-8 mx-auto border border-black/10 bg-black rounded block">
                    Register
                </button>
            </form>

        }
        </div>

    </Layout>)
}

export default Register;