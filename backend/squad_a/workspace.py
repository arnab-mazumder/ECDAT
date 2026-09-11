import os

from .config import IGNORE_SCAN_DIRS


def build_file_tree_and_contents(scan_root, findings):
    """Build the workspace tree and source contents for a scanned directory."""
    repo_name = os.path.basename(scan_root) or "target-repo"
    tree_root = {
        "id": repo_name,
        "name": repo_name,
        "type": "folder",
        "expanded": True,
        "children": [],
    }
    files_map = {}

    def add_to_tree(rel_path, children_list):
        parts = rel_path.replace("\\", "/").split("/")
        current = children_list
        accum_parts = []

        for idx, part in enumerate(parts):
            accum_parts.append(part)
            is_last = idx == len(parts) - 1
            if is_last:
                norm_rel = rel_path.replace("\\", "/")
                matching_finding = next(
                    (f for f in findings if f["file"].replace("\\", "/") == norm_rel),
                    None,
                )
                node = {
                    "id": norm_rel,
                    "name": part,
                    "type": "file",
                    "path": norm_rel,
                    "language": (
                        "python" if part.endswith(".py")
                        else "java" if part.endswith(".java")
                        else "javascript" if part.endswith((".js", ".jsx", ".mjs"))
                        else "typescript" if part.endswith((".ts", ".tsx"))
                        else "go" if part.endswith(".go")
                        else "cpp" if part.endswith((".cpp", ".cc", ".cxx", ".h", ".hpp"))
                        else "c" if part.endswith(".c")
                        else "yaml" if part.endswith((".yaml", ".yml"))
                        else "toml" if part.endswith(".toml")
                        else "json" if part.endswith(".json")
                        else "dockerfile" if part.lower() == "dockerfile" or part.endswith(".dockerfile")
                        else "plaintext"
                    ),
                    "hasIssue": matching_finding is not None,
                    "issueLine": matching_finding["line"] if matching_finding else None,
                    "findingId": matching_finding["id"] if matching_finding else None,
                }
                current.append(node)
                continue

            folder_id = "/".join(accum_parts)
            existing = next(
                (child for child in current if child["id"] == folder_id and child["type"] == "folder"),
                None,
            )
            if not existing:
                existing = {
                    "id": folder_id,
                    "name": part,
                    "type": "folder",
                    "expanded": True,
                    "children": [],
                }
                current.append(existing)
            current = existing["children"]

    skip_extensions = {
        ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".jar", ".class",
        ".exe", ".dll", ".so", ".dylib", ".tar", ".gz", ".7z", ".mp4",
        ".mov", ".avi", ".woff", ".woff2", ".ttf", ".eot", ".ico", ".iso",
        ".bin", ".dat", ".db", ".sqlite", ".pyc", ".pyo", ".map",
    }

    for root, dirs, files in os.walk(scan_root):
        dirs[:] = sorted(directory for directory in dirs if directory not in IGNORE_SCAN_DIRS)
        for filename in sorted(files):
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, scan_root).replace("\\", "/")
            add_to_tree(rel_path, tree_root["children"])

            matching_finding = next(
                (finding for finding in findings if finding["file"].replace("\\", "/") == rel_path),
                None,
            )
            extension = os.path.splitext(filename)[1].lower()
            content = ""
            if matching_finding is not None or (
                extension not in skip_extensions and os.path.getsize(full_path) < 500 * 1024
            ):
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as file_handle:
                        content = file_handle.read(500 * 1024)
                except (OSError, UnicodeError):
                    pass

            files_map[rel_path] = {
                "path": rel_path,
                "name": filename,
                "language": (
                    "Python" if filename.endswith(".py")
                    else "Java" if filename.endswith(".java")
                    else "JavaScript" if filename.endswith((".js", ".jsx", ".ts", ".tsx"))
                    else "Plaintext"
                ),
                "encoding": "UTF-8",
                "content": content,
                "findingId": matching_finding["id"] if matching_finding else None,
                "issueLine": matching_finding["line"] if matching_finding else None,
            }

    return [tree_root], files_map
