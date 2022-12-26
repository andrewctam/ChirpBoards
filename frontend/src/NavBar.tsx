const NavBar = () => {
    return <div className = 'w-full bg-stone-800 shadow-lg p-4  text-white flex justify-between items-center'>
                <h1 className = "font-semibold text-2xl">
                    <a href = "./">Chirp Boards</a>
                </h1>

                <div className = "text-md">
                    <a className = "text-gray-100" href = "./signin">Sign In</a>
                    <a className = "ml-8 text-sky-200" href = "./register">Register</a>
                </div>
            </div>

}
export default NavBar