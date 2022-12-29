import React, { useContext, useState } from "react";
import { UserContext } from "../App";
import Comment from "./Comment";
interface ReplyBoxProps {
    close: () => void
    postId: string
    addReply: (reply: JSX.Element) => void
}

function ReplyBox(props: ReplyBoxProps) {
    const [comment, setComment] = useState("");
    
    const userInfo = useContext(UserContext);

    const addComment = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `mutation {
            comment(text: "${comment}", parentPostId: "${props.postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                error
                post {
                    id
                    text
                    commentCount
                    postDate
                    score
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

        const info = response.data.comment.post;

        props.addReply(
            <Comment
                key = {info.id}
                id = {info.id}
                text = {info.text}
                postDate = {info.postDate}
                authorUsername = {info.author.username}
                authorDisplayName = {info.author.displayName}
                commentCount = {info.commentCount}
                score = {info.score}
            />
        
        )
        props.close();
        
    }

    return (
        <form onSubmit = {addComment} className = "w-full h-24 my-6 bg-gray-200 border border-black/25 shadow-lg relative rounded-xl">
            <textarea 
                value = {comment} 
                onChange = {(e) => setComment(e.target.value)} 
                className = "w-full h-full bg-transparent p-2 resize-none focus:outline-none placeholder:text-black/75"
                placeholder= "Add a comment..."/>


            <div className = "absolute -bottom-3 right-4">
                <button className = "bg-rose-100 text-black border border-black/20 rounded shadow-md  px-2 py-1" 
                    onClick = {props.close}>
                    Cancel
                </button>

                <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md -bottom-3 right-4 px-2 py-1 ml-2" 
                    onClick = {addComment}>
                    Reply
                </button>
            </div>

            
        </form>
    )
}

export default ReplyBox