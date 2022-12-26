import { useState } from "react"
import Vote from "./Vote"

interface CommentProps {
    id: string
}

function Comment(props: CommentProps) {
    const [author, setAuthor] = useState("Admin")
    const [date, setDate] = useState("Today")
    const [text, setText] = useState("Lorem")

    return (
        <div className = "w-11/12 mx-auto my-6 px-8 py-4 border border-black rounded-xl bg-white relative break-all">
            <a href = "./profile" className = "block mb-2">
                {author}
                
                <div className = "text-xs inline">
                    {` ${date}`} 
                </div>

            </a>
            {text}

            <Vote />
        </div>
    )

}

export default Comment;