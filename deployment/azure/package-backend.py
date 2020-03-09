# Package the backend for deployment
#
# Creates a zip file that contains everything that needs to be transferred to the server for deployment

import argparse
import os
import zipfile


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('root', help='Root directory of project')
    parser.add_argument('output', help='Output zip file')
    return parser.parse_args()


def check_root(root):
    print('Checking root folder...')
    if not os.path.isdir(os.path.join(root, 'wikidata-fuzzy-search')) or \
       not os.path.isdir(os.path.join(root, 'data-label-augmentation')):
       raise Exception(f'Root directory {root} does not contain the two repositories')


def package_dir(zf, root, top_folder, ignore_dir_list=None, ignore_file_list=None):
    # A default parameter value of [] is very problematic, as everybody gets the same
    # empty list.
    if not ignore_dir_list:
        ignore_dir_list = []
    if not ignore_file_list:
        ignore_file_list = []

    top = os.path.abspath(os.path.join(root, top_folder))
    real_top = os.path.dirname(top)

    for dirname, subdirs, files in os.walk(top):
        subdirs[:] = [d for d in subdirs if d not in ignore_dir_list]
        zip_dirname = os.path.relpath(dirname, real_top)

        print(zip_dirname)
        for file in files:
            if file in ignore_file_list:
                continue
            zf.write(os.path.join(dirname, file), arcname = os.path.join(zip_dirname, file))


def package_wikidata_fuzzy_search(zf, root):
    ignore_dirs = ['.git', 'frontend', 'env', '.vscode', 'cache', '__pycache__', 'data-label-augmentation']
    ignore_files = ['local_settings.py']
    package_dir(zf, root, 'wikidata-fuzzy-search', ignore_dirs, ignore_files)


def package_data_label_augmentation(zf, root):
    package_dir(zf, root, 'data-label-augmentation', ['.git', '.vscode'])


def run():
    print('Packaging the Wikidata Backend for deployment')
    args = parse_arguments()
    check_root(args.root)
    with zipfile.ZipFile(args.output, 'w') as zf:
        package_wikidata_fuzzy_search(zf, args.root)
        package_data_label_augmentation(zf, args.root)

    print(f'Package created at {args.output}')

if __name__ == '__main__':
    run()