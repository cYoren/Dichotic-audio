
export const AssetDownloader = () => {
    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Audio Assets Missing</h3>
            <p className="text-sm text-yellow-700 mb-3">
                Browser security (CORS) prevents loading audio from Google directly. 
                To hear real voices, you must download the digit files manually.
            </p>
            <div className="bg-gray-800 text-white p-3 rounded text-xs font-mono overflow-x-auto">
                # Run this in your terminal to download the assets:<br/>
                <br/>
                mkdir -p public/assets/digits<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/zero--_gb_1.mp3 -o public/assets/digits/0.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/one--_gb_1.mp3 -o public/assets/digits/1.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/two--_gb_1.mp3 -o public/assets/digits/2.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/three--_gb_1.mp3 -o public/assets/digits/3.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/four--_gb_1.mp3 -o public/assets/digits/4.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/five--_gb_1.mp3 -o public/assets/digits/5.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/six--_gb_1.mp3 -o public/assets/digits/6.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/seven--_gb_1.mp3 -o public/assets/digits/7.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/eight--_gb_1.mp3 -o public/assets/digits/8.mp3<br/>
                curl https://ssl.gstatic.com/dictionary/static/sounds/oxford/nine--_gb_1.mp3 -o public/assets/digits/9.mp3<br/>
            </div>
        </div>
    );
};


