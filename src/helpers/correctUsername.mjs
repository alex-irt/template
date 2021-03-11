export default function correctUsername(name) {
    return name.replace(/[^a-zå-æÀ-ÿ0-9-_.]/gi, '');
}
