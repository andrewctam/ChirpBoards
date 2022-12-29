import Layout from "../Layout";
import React, { useContext, useEffect, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";

function Register() {
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [repeatPasswordInput, setRepeatPasswordInput] = useState("");
    const [displayNameInput, setDisplayNameInput] = useState("");
    const [error, setError] = useState("");
    const userInfo = useContext(UserContext);
    const navigate = useNavigate()


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

        console.log(response)

        if (response.data.register.error) {
            setError(response.data.register.error);
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
            <form onSubmit={register} className = "mx-auto border border-black/10 w-fit px-12 py-4 rounded-xl bg-slate-100/10 shadow-md">
                <h1 className = "text-3xl">Register</h1>

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

                
                <p className = "text-rose-200">{error}</p>

                <button onClick = {register} className = "py-2 px-4 my-2 border border-black/10 bg-black rounded block">
                    Register
                </button>
            </form>
        }
        </div>

    </Layout>)
}

export default Register;