
interface CommentsPlaceholderProps {
    opacity: string,
    showNoComments?: boolean,
}
const CommentsPlaceholder = (props: CommentsPlaceholderProps) => {
    
    return (
        <div style = {{opacity: props.opacity}}
            className = {`w-[95%] ml-[5%] my-6 h-16 px-8 py-4 border border-black rounded-bl-xl rounded-tr-xl bg-black/5 text-gray-100`}>
            {props.showNoComments ?
                <div className = "text-center text-white text-xl select-none">
                    No Comments Yet
                </div>
            : null}
        </div>
    )
}


export default CommentsPlaceholder