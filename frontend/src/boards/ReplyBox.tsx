import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PostPayload, UserContext } from "../App";
import Comment from "./Comment";
interface ReplyBoxProps {
    close: () => void
    postId: string
    addReply: (reply: JSX.Element) => void
}

function ReplyBox(props: ReplyBoxProps) {
    const [comment, setComment] = useState("");
    
    const navigate = useNavigate();
    const userInfo = useContext(UserContext);

    const addComment = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!userInfo.state.username) {
            navigate(`/signin?return=${window.location.pathname}`)
            return;
        }

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `mutation {
            comment(text: "${comment}", parentPostId: "${props.postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                post {
                    id
                    text
                    postDate(timezone: ${timezone})
                    author {
                        username
                        displayName
                    }
                }
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

        const info: PostPayload = response.data.comment.post;

        props.addReply(
            <Comment
                key = {info.id}
                id = {info.id}
                text = {info.text}
                postDate = {info.postDate}
                authorUsername = {info.author.username}
                authorDisplayName = {info.author.displayName}
                commentCount = {0}
                score = {0}
                voteStatus = {0}
                local = {true}
                autoLoadComments = {false}
            />
        
        )
        props.close();
        
    }

    return (
        <form onSubmit = {addComment} className = "w-[95%] mx-auto h-24 my-6 bg-gray-200/25 border border-black/25  shadow-lg relative rounded-xl">
            <textarea 
                value = {comment} 
                onChange = {(e) => setComment(e.target.value)} 
                className = "w-full h-full bg-transparent p-2 resize-none focus:outline-none text-white"
                placeholder= "Add a comment..."/>


            <div className = "absolute -bottom-3 right-4">
                <button className = "bg-rose-200 text-black border border-black/20 rounded shadow-md px-2 py-1" 
                    onClick = {props.close}>
                    Cancel
                </button>

                <button className = "bg-[#b9cfe2] text-black border border-black/20 rounded shadow-md -bottom-3 right-4 px-2 py-1 ml-2" 
                    onClick = {addComment}>
                    Reply
                </button>
            </div>

            
        </form>
    )
}

export default ReplyBox