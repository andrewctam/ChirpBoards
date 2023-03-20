import Layout from "../Layout";
import React, { useContext, useState } from "react";
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
    const [searchParams] = useSearchParams();

    
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

        if (displayNameInput.length > 32) {
            setError("Display name must be less than 32 characters");
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


        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
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

        if (response.data.register.msg !== "Success") {
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

        localStorage.setItem("username", usernameInput.toLowerCase());
        localStorage.setItem("sessionToken", sessionToken);

        
        navigate(searchParams.get("redirect") ?? "/")
    }


    return (
    <Layout>
        <div className = "text-white mt-16 mx-auto w-11/12 md:w-4/5 mb-4">
            {userInfo.state.username ?
            <div className = "mx-auto w-fit">
                <p>Already signed in.</p>
                <button onClick = {() => { userInfo.dispatch({type: "SIGNOUT"}) }} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/20 rounded-xl block border border-black/50">
                    Sign Out
                </button>
            </div>
            :
            <div className = "grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={register} className = "mx-auto w-11/12 px-12 py-4 rounded-xl bg-black/20 shadow-md">
                    <h1 className = "text-2xl text-center">Create a New Account</h1>
                        <div className = "grid grid-cols-1 md:grid-cols-2 mt-12 gap-4">
                            <FormInput
                                name = "Username"
                                value = {usernameInput}
                                setValue = {setUsernameInput}
                                valid = {usernameInput.length >= 3 && usernameInput.length <= 16 && (/^[a-zA-Z0-9]+$/.test(usernameInput))} 
                            />

                            <FormInput
                                name = "Display Name"
                                value = {displayNameInput}
                                setValue = {setDisplayNameInput}
                                placeholder = {usernameInput}
                                valid = {(usernameInput.length > 0 && usernameInput.length <= 32) || (displayNameInput.length > 0 && displayNameInput.length <= 32)}
                            />
                        </div>

                        <div className = "grid grid-cols-1 md:grid-cols-2 mt-12 mb-10 gap-4">
                            <FormInput
                                name = "Password"
                                value = {passwordInput}
                                setValue = {setPasswordInput}
                                password = {true}
                                valid = {passwordInput.length >= 8}
                            />

                            <FormInput
                                name = "Repeat Password"
                                value = {repeatPasswordInput}
                                setValue = {setRepeatPasswordInput}
                                placeholder = ""
                                password = {true}
                                valid = {repeatPasswordInput === passwordInput && repeatPasswordInput !== "" && passwordInput.length >= 8}
                            />
                        </div>

                    <p className = "text-rose-200 break-words text-center my-4">{error}</p>

                    <button onClick = {register} className = "text-sm text-black px-8 py-2 mx-auto mb-2 bg-sky-200/90 rounded-xl block border border-black/50">
                        Sign Up
                    </button>
                </form>

                <div className = "mx-auto w-11/12 x-12 py-4 rounded-xl bg-black/20 shadow-md flex items-center justify-center text-center">
                    <div>
                        Welcome to Chirp Boards!
                        <div className="mt-2 mb-8">
                            Already have an account?
                            <a href="./signin" className="text-sky-200 ">
                                {" Sign in here"}
                            </a>
                        </div>

                        <ul className="list-disc text-left w-[90%] pl-12 mx-auto">
                            <li>Username must be between 3 and 20 characters</li>
                            <li>Username can only contain letters and numbers</li>
                            <li>Display name must be between 1 and 32 characters</li>
                            <li>Password must be at least 8 characters</li>
                            <li>You can change your user color and profile picture in the settings later</li>
                        </ul>
                    </div>

                   
                </div>

            </div>

        }
        </div>

    </Layout>)
}

export default Register;