import Layout from "../Layout";
import React, { useContext, useEffect, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";

function Settings() {
    const [oldPasswordInput, setOldPasswordInput] = useState("");
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [displayNameInput, setDisplayNameInput] = useState("");
    const [msg, setMsg] = useState("");

    const [editingDisplayName, setEditingDisplayName] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);

    const userInfo = useContext(UserContext);

    const navigate = useNavigate()
    

    useEffect(() => {
        if (!userInfo.state.username)
            navigate("/signin?return=true")
    }, [])
    
    const updateDisplayName = async () => {
        setMsg("");

        if (displayNameInput === "") {
            setMsg("Please enter a new display name");
            return;
        } else if (displayNameInput.length > 32) {
            setMsg("Display name must be less than 32 characters");
            return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            changeDisplayName(newDisplayName: "${displayNameInput}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
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

        setMsg(response.data.changeDisplayName.msg);        
        setDisplayNameInput("");
    }

    const updatePassword = async () => {
        setMsg("");
        
        if (oldPasswordInput === "") {
            setMsg("Please enter your current password");
        }

        if (newPasswordInput === "") {
            setMsg("Please enter a new password");
            return;
        }

        if (newPasswordInput.length < 8) {
            setMsg("New password must be at least 8 characters");
            return;
        }

        
        if (oldPasswordInput === newPasswordInput) {
            setMsg("New password must be different from the old password");
            return;
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            changePassword(oldPassword: "${oldPasswordInput}", newPassword: "${newPasswordInput}", username: "${userInfo.state.username}") {
                msg
                endRes
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

        setMsg(response.data.changePassword.msg);        
        setOldPasswordInput("");
        setNewPasswordInput("");
    }


    let center = null;
    if (editingPassword) {
        center = (<>
                <FormInput
                    name = "Current Password"
                    value = {oldPasswordInput}
                    setValue = {setOldPasswordInput}
                    password = {true}
                />

                <FormInput
                    name = "New Password"
                    value = {newPasswordInput}
                    setValue = {setNewPasswordInput}
                    placeholder = ""
                    password = {true}
                    mt = {"8"}
                />
                <p className = "text-white break-words my-3">{msg}</p>

                <button onClick = {() => {setEditingPassword(false); setMsg("")}} className = "py-1 px-2 mb-2 border border-black/25 text-white bg-rose-500/50 rounded mx-1">
                    Cancel
                </button>

                <button onClick = {updatePassword} className = "py-1 px-2 mb-2 border border-black/25 text-white bg-slate-700/50 rounded mx-1">
                    Save Changes
                </button>
        </>)
    } else if (editingDisplayName) {
        center = <>
                <FormInput
                    name = "New Display Name"
                    value = {displayNameInput}
                    setValue = {setDisplayNameInput}
                />

                <p className = "text-white break-words my-3">{msg}</p>

                <button onClick = {() => {setEditingDisplayName(false); setMsg("")}} className = "py-1 px-2 mb-2 border border-black/25 text-white bg-rose-500/50 rounded mx-1">
                    Cancel
                </button>

                <button onClick = {updateDisplayName} className = "py-1 px-2 mb-2 border border-black/25 text-white bg-slate-700/50 rounded mx-1">
                    Save Changes
                </button>

                
        </>
    } else 
    center = (<>
        <button 
            onClick = {() => {setEditingDisplayName(true)}} 
            className = "text-sm block border text-black border-black px-4 py-2 bg-slate-200 rounded-xl mx-auto my-1">
            Edit Display Name
        </button>

        <button onClick = {() => {setEditingPassword(true)}}
            className = "text-sm block border text-black border-black px-4 py-2 bg-slate-200 rounded-xl mx-auto my-1 mb-4 ">
            Change Password
        </button>
    </>)


    return (
        <Layout>
            <div className = "text-white mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <div className = "mx-auto border border-black/10 w-1/2 px-12 py-4 rounded-xl bg-slate-100/10 shadow-md text-center">
                    <h1 className = "text-3xl mb-4 ">Settings</h1>
                    {center}
                </div>
            </div>

        </Layout>)
    }

export default Settings;