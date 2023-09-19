# Universidad del Valle de Guatemala
# 2023 - Miguel Novella Linares
#     Script generador de nombres y Nodos para Lab3-4
#     para la clase de Redes

##########################################
#Formato
#   {"type":"topo",
#    "config":{"A":["B","C"],
#               "B":["A"],
#               "C":["A"],}
#   }
#   {"type":"names",
#    "config":{"A":"foo@alumchat.xyz",
#               "B":"bar@alumchat.xyz",
#               "C":"yeet@alumchat.xyz",}
#   }
##########################################
import numpy as np
import string, random, traceback, argparse

_EXAMPLE = ["foo", "bar", "yeet", "lol", "woot", "omg", "swag"]
# _SECC10 = ["cas18546@uvg.edu.gt","cou18817@uvg.edu.gt","cre19541@uvg.edu.gt",
# "cue18220@uvg.edu.gt","dele19270@uvg.edu.gt","dele19298@uvg.edu.gt",
# "dele19817@uvg.edu.gt","gar18071@uvg.edu.gt","gar19344@uvg.edu.gt",
# "her15177@uvg.edu.gt","her19202@uvg.edu.gt","mon18139@uvg.edu.gt",
# "pai191142@uvg.edu.gt","pin19087@uvg.edu.gt","por19825@uvg.edu.gt",
# "que191002@uvg.edu.gt","qui18288@uvg.edu.gt","ram19184@uvg.edu.gt",
# "sal18764@uvg.edu.gt","ven19554@uvg.edu.gt","vil19086@uvg.edu.gt"]

# TODO aca irian los correos de todos nosotros.
# Notese que dice @uvg.edu.gt, pero el formato de [tresletrasapellido][carnet]
# es el mismo que seguimos en alumchat, por lo que solo tomamos antes del @
# y luego de agregamos @alumchat.xyz

A = ["cas18546@uvg.edu.gt","cou18817@uvg.edu.gt","cre19541@uvg.edu.gt",
"cue18220@uvg.edu.gt","dele19270@uvg.edu.gt","dele19298@uvg.edu.gt",
"dele19817@uvg.edu.gt","gar18071@uvg.edu.gt","gar19344@uvg.edu.gt",
"her15177@uvg.edu.gt"]

#B la mitad segunda de la clase
B = ["her19202@uvg.edu.gt","mon18139@uvg.edu.gt",
"pai191142@uvg.edu.gt","pin19087@uvg.edu.gt","por19825@uvg.edu.gt",
"que191002@uvg.edu.gt","qui18288@uvg.edu.gt","ram19184@uvg.edu.gt",
"sal18764@uvg.edu.gt","ven19554@uvg.edu.gt","vil19086@uvg.edu.gt"]

_SECC10 = _EXAMPLE
VER = "1-x"

def generateConfig(dict, fname, t):
    """
    Metodo que recibe un diccionario y escribe un archivo de configuracion names-*.txt

    Recibe: dict - un diccionario
            fname - string, el nombre del archivo
    Retorna: nada
    """
    equipo = "X"
    if _SECC10 == A:
        equipo = "A"
    if _SECC10 == B:
        equipo = "B"
    try:
        with open(fname+equipo+'-2023.txt', 'w') as f:
            the_config = str(dict)
            body = '{{"type":"{T}", "config":{PYLD} }}'.format(T = t, PYLD = the_config)
            f.write(body)
    except:
        print("Error Writing file...")
        traceback.print_exc()

def matrix2Dict(m):
    """
    Metodo que recibe una matriz de adjacencia y la convierte en un diccionario con arrays como values, \n
    con los vecinos como elementos del array.

    Recibe: matriz m de ajdacencia (por ende, cuadrada y simetrica), de N x N
    Retorna: Diccionario
    """
    #aprovechamos el uso de numpy y de nonzero para obtener los vecinos de forma eficiente
    #usamos tolist() para volverlo list y usamos dict comprehension para llenar el dict con N
    #usamos de forma astuta chr() para convertir de entero a su ASCII correspondiente + 65 (para que inicie en 'A')
    #el inverso de chr() es ord() y recibe el caracter y devuelve su ascii
    return {chr(i+65): [chr(j+65) for j in np.nonzero(row)[0].tolist()] for i,row in enumerate(m)}

def users2Dict(usrs):
    """
    Metodo que recibe una lista con nombres y la convierte en un diccionario con la asignacion \n

    Recibe: usrs - lista con N usuarios
    Retorna: Diccionario
    """
    #igual, aprovechamos numpy, y el formato ASCII y list comprehension
    return {chr(i+65): row.split("@")[0]+"@alumchat.xyz" for i,row in enumerate(usrs)}

def generateRandomTopology(name_list=[], fname="topo"+VER+"-random"):
    """
    Metodo que genera una topologia aleatoreamente
    """
    if len(name_list)==0:
        name_list = _EXAMPLE
    #generar una matriz de adjacencia
    M = 3   #numero de vecinos promedio (esperado), debe ser menor o igual a N
    N = len(name_list)   #total de nodos
    #se modela ese numero de vecinos esperados sampleando de una distribucion Bernoulli(p)
    #donde p=(0,1) y en nuestro caso representa esa proporcion entre M y N
    #Como su valor esperado es p entonces repitiendo el experimento N veces obtenemos n * M / N = M (conexiones en promedio)

    random_matrix = np.random.binomial(n=1, p=M/N, size=(N,N)) #Binomial con n=1 es Bernouli(p), no encontre metodo bernoulli como tal
    #obtener triangulo inferior/superior de matriz (setea 0 el resto), transpose, sumar, para obtener simetria
    matriz_res = np.tril(random_matrix) + np.tril(random_matrix, -1).T
    np.fill_diagonal(matriz_res, 0) #adjacencia al mismo nodo es 0
    generateConfig(matrix2Dict(matriz_res), fname, 'topo')

def assignRandomNames(name_list=[], fname="names"+VER+"-random"):
    """
    Metodo que genera la asignacion aleatoreamente
    """
    if len(name_list)==0:
        name_list = _EXAMPLE
    all_users = name_list

    random.shuffle(all_users)
    generateConfig(users2Dict(all_users), fname, 'names')


#################################################################################


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", action='store_true',
                    help="Generate random Names")
    parser.add_argument("-t", action='store_true',
                    help="Generate random Topology")
    parser.add_argument("-d", action='store_true',
                    help="Use Demo Values")

    args = parser.parse_args()

    if args.n:
        if args.d:
            assignRandomNames(name_list=_EXAMPLE)
        else:
            assignRandomNames(name_list=_SECC10)
        print("Asignacion de Nombres Generada...")
    if args.t:
        if args.d:
            generateRandomTopology(name_list=_EXAMPLE)
        else:
            generateRandomTopology(name_list=_SECC10)
        print("Topologia Generada...")

    if not args.n and not args.t :
        #no option, default solo nombres
        assignRandomNames()
        print("Asignacion de Nombres Generada...")
