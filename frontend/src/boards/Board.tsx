import { useState } from "react"
import Layout from "../Layout"
import Comment from "./Comment"
import Vote from "./Vote"

interface BoardProps {
    id: string
}

function Board(props: BoardProps) {
    const [author, setAuthor] = useState("Admin")
    const [date, setDate] = useState("Today")
    const [text, setText] = useState("Lorem")

    const [comment, setComment] = useState("");

    return (
        <Layout>
            <div className = "mt-8 mx-auto w-11/12 md:w-4/5 lg:w-3/4">
                <div className = "w-full mt-16 mb-4 px-8 py-4 border border-black rounded-xl bg-slate-300 relative break-all">
                    <a href = "./profile" className = "block mb-2">
                        {author}
                        
                        <div className = "text-xs inline">
                            {` ${date}`} 
                        </div>

                    </a>

                    {text}
                    <Vote />
                </div>

                <form onSubmit = {undefined} className = "w-full h-24 mb-12 bg-gray-100 border border-black/10 shadow-lg relative rounded-xl">
                    <textarea 
                        value = {comment} 
                        onChange = {(e) => setComment(e.target.value)} 
                        className = "w-full h-full bg-transparent p-2 resize-none focus:outline-none placeholder:text-black/75"
                        placeholder= "Add a comment..."/>

                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md absolute -bottom-3 right-4 px-2 py-1" 
                        onClick = {undefined}>
                        Comment
                    </button>
                </form>

                <Comment id = "Bob" />

                <Comment id = "Bob" />

                <Comment id = "Bob" />
            </div>
        </Layout>
    )


}


export default Board