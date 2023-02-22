import Layout from "../Layout";
import { useContext, useEffect, useState } from "react";
import FormInput from "./FormInput";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import PictureInput from "./PictureInput";

enum Setting {
    None,
    DisplayName,
    Password,
    UserColor,
    Picture
}
function Settings() {
    const [oldPasswordInput, setOldPasswordInput] = useState("");
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [displayNameInput, setDisplayNameInput] = useState("");
    const [editing, setEditing] = useState(Setting.None);
    
    const [msg, setMsg] = useState("");
    const userInfo = useContext(UserContext);
    const navigate = useNavigate()
    

    useEffect(() => {
        if (!userInfo.state.username)
        navigate(`/signin?return=${window.location.pathname}`)
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
    switch (editing) {
        case Setting.Password:
            center = (<>
                    <FormInput
                        name = "Current Password"
                        value = {oldPasswordInput}
                        setValue = {setOldPasswordInput}
                        password = {true}
                        valid = {oldPasswordInput !== ""}
                    />

                    <FormInput
                        name = "New Password"
                        value = {newPasswordInput}
                        setValue = {setNewPasswordInput}
                        placeholder = ""
                        password = {true}
                        mt = {"8"}
                        valid = {newPasswordInput.length >= 8}
                    />
                    <p className = "text-white break-words my-3">{msg}</p>

                    <button onClick = {() => {setEditing(Setting.None); setMsg("")}} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                        Cancel
                    </button>

                    <button onClick = {updatePassword} disabled = {!oldPasswordInput && !newPasswordInput} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 disabled:bg-white/5 disabled:text-gray-100/50">
                        Save Changes
                    </button>
            </>)
            break;
    case Setting.DisplayName:
        center = <>
                <FormInput
                    name = "New Display Name"
                    value = {displayNameInput}
                    setValue = {setDisplayNameInput}
                    valid = {displayNameInput.length <= 32 && displayNameInput.length > 0}
                />

                <p className = "text-white break-words my-3">{msg}</p>

                <button onClick = {() => {setEditing(Setting.None); setMsg("")}} className = "text-sm text-white px-4 py-2 mx-auto my-2 mr-2 bg-rose-700/30 rounded-xl border border-black/50">
                    Cancel
                </button>

                <button onClick = {updateDisplayName} disabled = {!displayNameInput} className = "text-sm text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 disabled:bg-white/5 disabled:text-gray-100/50">
                    Save Changes
                </button>
        </>
        break;
    case Setting.Picture:
        center = <PictureInput 
                    close = {() => {
                        setEditing(Setting.None); 
                        setMsg("")
                    }}
                />
        break;
    
    default:
        center = (<>
            <button 
                onClick = {() => {setEditing(Setting.DisplayName)}} 
                className = "text-sm block text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 min-w-[200px]">
                Edit Display Name
            </button>

            <a
                href = {`/profile/${userInfo.state.username}?editColor=true`}
                className = "text-sm block text-white w-fit px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 min-w-[200px]">
                Edit User Color
            </a>

            <button onClick = {() => {setEditing(Setting.Picture)}}
                className = "text-sm block text-white px-4 py-2 mx-auto my-2 bg-black/10 rounded-xl border border-black/50 min-w-[200px]">
                Change Profile Picture
            </button>

            <button onClick = {() => {setEditing(Setting.Password)}}
                className = "text-sm block text-white px-4 py-2 mx-auto my-1 mb-4  bg-black/10 rounded-xl border border-black/50 min-w-[200px]">
                Change Password
            </button>
        </>)
    }


    return (
        <Layout>
            <div className = "text-white mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <div className = "mx-auto border border-black/10 w-5/6 md:w-3/4 lg:w-1/2 px-12 py-4 rounded-xl bg-black/10 shadow-md text-center">
                    <h1 className = "text-3xl mb-4 ">Settings</h1>
                    {center}
                </div>
            </div>

        </Layout>)
    }

export default Settings;