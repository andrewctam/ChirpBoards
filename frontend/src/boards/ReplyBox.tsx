import { useState } from "react";

interface ReplyBoxProps {
    cancel: () => void
    id: string
}
function ReplyBox(props: ReplyBoxProps) {
    const [comment, setComment] = useState("");

    return (
        <form onSubmit = {undefined} className = "w-full h-24 my-6 bg-gray-200 border border-black/10 shadow-lg relative rounded-xl">
            <textarea 
                value = {comment} 
                onChange = {(e) => setComment(e.target.value)} 
                className = "w-full h-full bg-transparent p-2 resize-none focus:outline-none placeholder:text-black/75"
                placeholder= "Add a comment..."/>


            <div className = "absolute -bottom-3 right-4">
                <button className = "bg-rose-100 text-black border border-black/20 rounded shadow-md  px-2 py-1" 
                    onClick = {props.cancel}>
                    Cancel
                </button>

                <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md -bottom-3 right-4 px-2 py-1 ml-2" 
                    onClick = {undefined}>
                    Comment
                </button>
            </div>

            
        </form>
    )
}

export default ReplyBox